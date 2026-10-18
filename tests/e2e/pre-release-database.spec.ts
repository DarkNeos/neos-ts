import { expect, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

const oldCard = 100000001;
const newCard = 101307067;
let oldDatabase: Buffer;
let newDatabase: Buffer;
let releaseDatabase: Buffer;

test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER, alias INTEGER DEFAULT 0); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
  );
  releaseDatabase = Buffer.from(db.export());
  db.run(
    `INSERT INTO datas (id, type) VALUES (${oldCard}, 2); INSERT INTO texts VALUES (${oldCard}, '原有超先行卡', '');`,
  );
  oldDatabase = Buffer.from(db.export());
  db.run(
    `INSERT INTO datas (id, type) VALUES (${newCard}, 2); INSERT INTO texts VALUES (${newCard}, '决斗者之力', '');`,
  );
  newDatabase = Buffer.from(db.export());
  db.close();
});

async function resources(page: Page) {
  const state = {
    version: "100",
    versionFailure: "" as "" | "http" | "invalid" | "timeout",
    databaseFailure: false,
    versions: [] as string[],
    databases: [] as string[],
    lists: [] as string[],
    releaseDownloads: 0,
  };
  await page.route("**/ygopro-super-pre/data/version.txt", (route) => {
    state.versions.push(state.version);
    if (state.versionFailure === "timeout") return;
    if (state.versionFailure === "http") return route.fulfill({ status: 503 });
    return route.fulfill({
      body:
        state.versionFailure === "invalid"
          ? "<html>error</html>"
          : `${state.version}\n`,
    });
  });
  await page.route(/\/test-release\.cdb(?:\?.*)?$/, (route) => {
    state.databases.push(route.request().url());
    return route.fulfill({
      status: state.databaseFailure ? 503 : 200,
      body: state.version === "100" ? oldDatabase : newDatabase,
    });
  });
  await page.route(/\/cards\.cdb(?:\?.*)?$/, (route) => {
    state.releaseDownloads++;
    return route.fulfill({ body: releaseDatabase });
  });
  await page.route(/\/test-release-v2\.json(?:\?.*)?$/, (route) => {
    const version = new URL(route.request().url()).searchParams.get("v");
    state.lists.push(version ?? "");
    // 无版本的地址模拟仍在 HTTP 缓存中的旧分类列表。
    return route.fulfill({
      json: (version === "200" ? [oldCard, newCard] : [oldCard]).map((id) => ({
        id,
      })),
    });
  });
  await page.route("**/*.conf", (route) => route.fulfill({ body: "" }));
  await page.route("**/api/mdpro3/deck/list?*", (route) =>
    route.fulfill({ json: { code: 0, data: { total: 0, records: [] } } }),
  );
  await page.route(/\/\d+\.(webp|jpg)$/, (route) =>
    route.fulfill({ path: "neos-assets/card_back.webp" }),
  );
  return state;
}

async function ready(page: Page) {
  await page.evaluate(async () => {
    await (await import("/src/ui/Layout/utils.ts")).initializeApp();
  });
}

async function expectNewCard(page: Page) {
  await ready(page);
  await page.getByTestId("deck-search-input").fill("决斗者之力");
  await page.getByTestId("deck-search-input").press("Enter");
  await expect(
    page.locator(`[data-card-source="search"][data-card-code="${newCard}"]`),
  ).toBeVisible();
  expect(
    await page.evaluate(async (id) => {
      const { fetchCard } = await import("/src/api/cards.ts");
      return fetchCard(id).text.name;
    }, newCard),
  ).toBe("决斗者之力");
}

test("replaces a recent unversioned database cache and refreshes the card list", async ({
  page,
}) => {
  const state = await resources(page);
  await page.route("**/prerelease-cache-test", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html></html>" }),
  );
  await page.goto("/prerelease-cache-test");
  await page.evaluate(async () => {
    const { useConfig } = await import("/src/config/index.ts");
    const { cachedBinary } = await import("/src/infra/resourceCache.ts");
    await cachedBinary(useConfig().preReleaseResource.cdb);
  });
  state.version = "200";
  await page.goto("/build");
  await expectNewCard(page);
  expect(state.databases).toHaveLength(2);
  expect(state.databases[1]).toMatch(/\?v=200$/);
  expect(state.lists).toEqual(["200"]);
});

test("refreshes on a version change and reuses the same version without downloading the database", async ({
  page,
}) => {
  const state = await resources(page);
  await page.goto("/build");
  await ready(page);
  expect(state.databases).toHaveLength(1);
  state.version = "200";
  await page.reload();
  await expectNewCard(page);
  expect(state.databases).toHaveLength(2);
  await page.reload();
  await expectNewCard(page);
  expect(state.databases).toHaveLength(2);
  expect(state.versions).toEqual(["100", "200", "200"]);
  expect(state.lists).toEqual(["100", "200", "200"]);
  expect(state.releaseDownloads).toBe(1);
});

for (const failure of ["http", "invalid", "timeout"] as const) {
  test(`keeps a usable cache when the version check fails with ${failure} and checks again after reload`, async ({
    page,
  }) => {
    const state = await resources(page);
    await page.goto("/build");
    await ready(page);
    state.version = "200";
    state.versionFailure = failure;
    await page.reload();
    await ready(page);
    await expect(
      page.locator(`[data-card-source="search"][data-card-code="${oldCard}"]`),
    ).toBeVisible();
    expect(state.databases).toHaveLength(1);
    state.versionFailure = "";
    await page.reload();
    await expectNewCard(page);
    expect(state.databases).toHaveLength(2);
  });
}

test("keeps the old database after a failed update and retries the new version after reload", async ({
  page,
}) => {
  const state = await resources(page);
  await page.goto("/build");
  await ready(page);
  state.version = "200";
  state.databaseFailure = true;
  await page.reload();
  await ready(page);
  await expect(
    page.locator(`[data-card-source="search"][data-card-code="${oldCard}"]`),
  ).toBeVisible();
  expect(state.databases).toHaveLength(4); // 原下载加上失败分段的三次尝试。
  state.databaseFailure = false;
  await page.reload();
  await expectNewCard(page);
  expect(state.databases).toHaveLength(5);
});
