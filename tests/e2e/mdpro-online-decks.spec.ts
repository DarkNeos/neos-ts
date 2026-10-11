import { expect, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

const mine = [
  { deckId: "mine-a", deckName: "我的卡组A" },
  { deckId: "mine-b", deckName: "我的卡组B" },
  { deckId: "deleted", deckName: "已删除卡组", isDelete: true },
].map((deck) => ({
  deckContributor: "mdpro-test-user",
  deckCase: 1082012,
  userId: 12345,
  isDelete: false,
  ...deck,
}));
const publicDeck = {
  ...mine[0],
  deckId: "someone-else",
  deckName: "他人的公开卡组",
  deckContributor: "another-user",
  userId: 67890,
};
const publicResponse = {
  code: 0,
  message: "",
  data: { total: 1, records: [publicDeck] },
};
let database: Buffer;

test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER, alias INTEGER DEFAULT 0); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
  );
  db.run(
    "INSERT INTO datas (id, type) VALUES (1000001, 1); INSERT INTO texts VALUES (1000001, '测试卡', '');",
  );
  database = Buffer.from(db.export());
  db.close();
});

test.beforeEach(async ({ page }) => {
  await page.route("**/*.cdb", (route) => route.fulfill({ body: database }));
  await page.route("**/*.conf", (route) => route.fulfill({ body: "" }));
  await page.route("**/test-release-v2.json", (route) =>
    route.fulfill({ json: [] }),
  );
  // 所有卡组请求都由模拟接口处理，删除回归不改动真实云端数据。
  await page.route("**/api/mdpro3/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/mdpro3/deck/list")
      return route.fulfill({ json: publicResponse });
    if (path === "/api/mdpro3/sync/12345/nodel")
      return route.fulfill({ json: { code: 0, message: "", data: mine } });
    if (path === "/api/mdpro3/sync/multi")
      return route.fulfill({ json: { code: 0, message: "", data: 1 } });
    return route.fulfill({
      status: 400,
      json: { code: 400, message: "不支持的卡组请求" },
    });
  });
});

async function openOnlineDecks(page: Page) {
  await page.goto("/match");
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  await page.evaluate(async () => {
    const { initializeApp } = await import("/src/ui/Layout/utils.ts");
    await initializeApp();
    const { accountStore } = await import("/src/stores/index.ts");
    accountStore.login({
      id: 12345,
      username: "mdpro-test-user",
      name: "测试用户",
      email: "test@example.test",
      token: "mock-mdpro-token",
      external_id: 12345,
      avatar_url: "",
    });
    history.pushState({}, "", "/build");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await page.getByRole("button", { name: /MDPro在线卡组/ }).click();
}

async function showMine(page: Page) {
  await page.getByTestId("mdpro-deck-scope").click();
  await page.getByText("只显示我上传的卡组", { exact: true }).click();
}

const deckA = (page: Page) => page.locator('[data-deck-id="mine-a"]');
async function deleteFirst(page: Page) {
  if (!(await page.getByRole("dialog").isVisible())) {
    await deckA(page).click({ button: "right" });
    await page.getByRole("menuitem", { name: "删除", exact: true }).click();
  }
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "删除云端卡组", exact: true })
    .click();
}

test("deletes an owned deck with MDPro3's batch protocol and hides cached deleted records", async ({
  page,
}) => {
  let request;
  await page.route("**/api/mdpro3/sync/multi", async (route) => {
    request = {
      method: route.request().method(),
      body: route.request().postDataJSON(),
      headers: route.request().headers(),
    };
    await route.fulfill({ json: { code: 0, message: "", data: 1 } });
  });
  await openOnlineDecks(page);
  await showMine(page);
  await expect(page.getByTestId("mdpro-online-deck")).toHaveCount(2);
  await deleteFirst(page);
  await expect(page.getByText("删除卡组成功", { exact: true })).toBeVisible();
  await expect(deckA(page)).toHaveCount(0);
  await expect(page.locator('[data-deck-id="mine-b"]')).toBeVisible();
  expect(request).toMatchObject({
    method: "POST",
    body: {
      userId: 12345,
      deckContributor: "mdpro-test-user",
      decks: [{ deckId: "mine-a", isDelete: true }],
    },
    headers: {
      "content-type": "application/json",
      reqsource: "MDPro3",
      token: "mock-mdpro-token",
    },
  });
  // 个人列表故意一直返回旧数据，重新搜索仍不能恢复已删除记录。
  await page.getByTestId("deck-search-input").fill("我的");
  const refreshed = page.waitForResponse("**/api/mdpro3/sync/12345/nodel");
  await page.getByTestId("deck-search-submit").click();
  await refreshed;
  await expect(page.getByTestId("mdpro-online-deck")).toHaveCount(1);
  await expect(deckA(page)).toHaveCount(0);
});

for (const failure of [
  {
    name: "zero deletions",
    status: 200,
    json: { code: 0, message: "", data: 0 },
    error: "删除卡组失败，服务器未确认删除，请稍后重试。",
  },
  {
    name: "an expired login",
    status: 401,
    json: { code: 401, message: "登录已过期，请重新登录" },
    error: "登录已过期，请重新登录",
  },
  {
    name: "an HTTP failure without a message",
    status: 503,
    json: { message: "" },
    error: "云卡组请求失败（HTTP 503）",
  },
]) {
  test(`keeps the deck and reports ${failure.name}`, async ({ page }) => {
    await page.route("**/api/mdpro3/sync/multi", (route) =>
      route.fulfill({ status: failure.status, json: failure.json }),
    );
    await openOnlineDecks(page);
    await showMine(page);
    await deleteFirst(page);
    await expect(page.getByText(failure.error, { exact: true })).toBeVisible();
    await expect(deckA(page)).toBeVisible();
    await expect(page.getByText("删除卡组成功", { exact: true })).toHaveCount(
      0,
    );
  });
}

test("reports an interrupted deletion and allows retrying it", async ({
  page,
}) => {
  let attempts = 0;
  await page.route("**/api/mdpro3/sync/multi", (route) => {
    if (++attempts === 1) return route.abort("failed");
    return route.fulfill({ json: { code: 0, message: "", data: 1 } });
  });
  await openOnlineDecks(page);
  await showMine(page);
  await deleteFirst(page);
  await expect(
    page.getByText("云卡组请求未完成，请检查网络后重试", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(deckA(page)).toBeVisible();
  await deleteFirst(page);
  await expect(deckA(page)).toHaveCount(0);
  expect(attempts).toBe(2);
});

test("a failed personal list never presents public decks as owned decks", async ({
  page,
}) => {
  await page.route("**/api/mdpro3/sync/12345/nodel", (route) =>
    route.fulfill({ status: 401, json: { message: "登录已过期" } }),
  );
  await openOnlineDecks(page);
  await expect(page.locator('[data-deck-id="someone-else"]')).toBeVisible();
  await showMine(page);
  await expect(
    page.getByText("登录已过期", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByTestId("mdpro-online-deck")).toHaveCount(0);
});

test("a late public list response cannot replace the personal list", async ({
  page,
}) => {
  let releasePublic: () => void;
  const pending = new Promise<void>((resolve) => (releasePublic = resolve));
  await page.route("**/api/mdpro3/deck/list?*", async (route) => {
    await pending;
    await route.fulfill({ json: publicResponse });
  });
  await openOnlineDecks(page);
  await showMine(page);
  await expect(page.getByTestId("mdpro-online-deck")).toHaveCount(2);
  const responded = page.waitForResponse("**/api/mdpro3/deck/list?*");
  releasePublic!();
  await responded;
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
  await expect(page.getByTestId("mdpro-online-deck")).toHaveCount(2);
  await expect(page.locator('[data-deck-id="someone-else"]')).toHaveCount(0);
});
