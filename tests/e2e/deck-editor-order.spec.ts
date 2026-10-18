import { expect, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

// 同名副本和多行主卡组共同覆盖按位置拖动，避免只按卡片密码操作。
const initialDeck = {
  deckName: "排序测试卡组",
  main: [
    1000001,
    1000002,
    1000001,
    ...Array.from({ length: 9 }, (_, i) => 1000003 + i),
  ],
  extra: [2000003, 2000001, 2000002],
  side: [1000012, 1000013, 1000014],
};
type Zone = "main" | "extra" | "side";
let database: Buffer;

test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER, alias INTEGER DEFAULT 0); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
  );
  for (const [base, count, type] of [
    [1000001, 20, 1],
    [2000001, 3, 0x41],
  ]) {
    for (let i = 0; i < count; i++) {
      db.run("INSERT INTO datas (id, type) VALUES (?, ?)", [base + i, type]);
      db.run("INSERT INTO texts VALUES (?, ?, '')", [
        base + i,
        `排序测试卡 ${base + i}`,
      ]);
    }
  }
  database = Buffer.from(db.export());
  db.close();
});

test.beforeEach(async ({ page }) => {
  await page.route("**/ygopro-super-pre/data/version.txt", (route) =>
    route.fulfill({ body: "1792173550" }),
  );
  await page.route(/\.cdb(?:\?.*)?$/, (route) =>
    route.fulfill({ body: database }),
  );
  await page.route("**/*.conf", (route) =>
    route.fulfill({ body: "!system 1211 确认" }),
  );
  await page.route(/\/test-release-v2\.json(?:\?.*)?$/, (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/mdpro3/deck/list?*", (route) =>
    route.fulfill({ json: { code: 0, data: { total: 0, records: [] } } }),
  );
  await page.goto("/match");
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  await page.evaluate(async (deck) => {
    await (await import("/src/ui/Layout/utils.ts")).initializeApp();
    const { deckStore } = await import("/src/stores/index.ts");
    await deckStore.reset();
    await deckStore.add(deck);
    const { deckDraftStore } = await import("/src/stores/deckDraftStore.ts");
    await deckDraftStore.open(
      deckStore.get(deck.deckName),
      `local:${deck.deckName}`,
    );
    history.pushState({}, "", "/build");
    dispatchEvent(new PopStateEvent("popstate"));
  }, initialDeck);
  await expect(page.getByTestId("deck-start-training")).toBeEnabled();
  await expectOrder(page, "main", initialDeck.main);
});

const zone = (page: Page, type: Zone) =>
  page.locator(`[data-testid="deck-zone"][data-deck-zone="${type}"]`);
const cards = (page: Page, type: Zone) =>
  zone(page, type).getByTestId("deck-card");

/** 从界面 DOM 读取真实排列，而非只检查编辑器内部数组。 */
async function expectOrder(page: Page, type: Zone, expected: number[]) {
  await expect
    .poll(() =>
      cards(page, type).evaluateAll((nodes) =>
        nodes.map((node) => Number(node.getAttribute("data-card-code"))),
      ),
    )
    .toEqual(expected);
}

/** 分别拖到目标卡片左右半区，验证前后插入位置。 */
async function dragCard(
  page: Page,
  type: Zone,
  from: number,
  target: number,
  after = false,
) {
  const destination = cards(page, type).nth(target);
  const rect = await destination.boundingBox();
  expect(rect).not.toBeNull();
  await cards(page, type)
    .nth(from)
    .dragTo(destination, {
      targetPosition: { x: after ? rect!.width - 2 : 2, y: rect!.height / 2 },
    });
}

/** 同时检查修改标记和详情状态，防止拖动结束误触打开详情。 */
async function editorState(page: Page) {
  return page.evaluate(async () => {
    const { editDeckStore } = await import("/src/ui/BuildDeck/store.ts");
    const { editingDeckToIDeck } = await import("/src/ui/BuildDeck/utils.ts");
    const { selectedCard } = await import("/src/ui/BuildDeck/index.tsx");
    return {
      deck: editingDeckToIDeck(editDeckStore),
      edited: editDeckStore.edited,
      detailOpen: selectedCard.open,
    };
  });
}

test("moves the chosen duplicate before and after cards, across rows and to the end", async ({
  page,
}) => {
  await dragCard(page, "main", 2, 0);
  const expected = [...initialDeck.main];
  expected.splice(0, 0, expected.splice(2, 1)[0]);
  await expectOrder(page, "main", expected);
  await dragCard(page, "main", 0, 3, true);
  expected.splice(3, 0, expected.shift()!);
  await expectOrder(page, "main", expected);
  await dragCard(page, "main", 11, 1);
  expected.splice(1, 0, expected.pop()!);
  await expectOrder(page, "main", expected);
  const rect = await zone(page, "main").boundingBox();
  await cards(page, "main")
    .first()
    .dragTo(zone(page, "main"), {
      targetPosition: { x: 24, y: rect!.height - 12 },
    });
  expected.push(expected.shift()!);
  await expectOrder(page, "main", expected);
  expect(await editorState(page)).toEqual({
    deck: { ...initialDeck, main: expected },
    edited: true,
    detailOpen: false,
  });
});

test("reorders a full main deck without applying card addition limits", async ({
  page,
}) => {
  const fullDeck = Array.from({ length: 20 }, (_, i) =>
    Array(3).fill(1000001 + i),
  ).flat();
  await page.evaluate(async (codes) => {
    const { fetchCard } = await import("/src/api/index.ts");
    const { editDeckStore } = await import("/src/ui/BuildDeck/store.ts");
    editDeckStore.main = codes.map(fetchCard);
  }, fullDeck);
  await expectOrder(page, "main", fullDeck);
  await dragCard(page, "main", 5, 0);
  fullDeck.unshift(fullDeck.splice(5, 1)[0]);
  await expectOrder(page, "main", fullDeck);
  await dragCard(page, "main", 59, 0);
  fullDeck.unshift(fullDeck.pop()!);
  await expectOrder(page, "main", fullDeck);
  expect((await editorState(page)).deck.main).toHaveLength(60);
});

test("previews insertion without changing the deck when the drag is cancelled", async ({
  page,
}, info) => {
  const source = await cards(page, "main").nth(1).boundingBox();
  const target = await cards(page, "main").first().boundingBox();
  await page.mouse.move(
    source!.x + source!.width / 2,
    source!.y + source!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    source!.x + source!.width / 2 + 10,
    source!.y + source!.height / 2,
    { steps: 3 },
  );
  await page.mouse.move(
    target!.x + target!.width / 4,
    target!.y + target!.height / 2,
    {
      steps: 10,
    },
  );
  // 等待拖拽后端处理这一帧，再在同一卡片上触发 dragover。
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
  await page.mouse.move(
    target!.x + target!.width / 4 + 1,
    target!.y + target!.height / 2,
  );
  await expect(cards(page, "main").first()).toHaveAttribute(
    "data-drop-position",
    "before",
  );
  expect(await editorState(page)).toEqual({
    deck: initialDeck,
    edited: false,
    detailOpen: false,
  });
  await page.screenshot({ path: info.outputPath("deck-order-insertion.png") });
  const title = await page.getByPlaceholder("请输入卡组名字").boundingBox();
  await page.mouse.move(
    title!.x + title!.width / 2,
    title!.y + title!.height / 2,
    { steps: 10 },
  );
  await page.mouse.up();
  await expect(page.locator("[data-drop-position]")).toHaveCount(0);
  await dragCard(page, "main", 1, 1);
  expect(await editorState(page)).toEqual({
    deck: initialDeck,
    edited: false,
    detailOpen: false,
  });
});

test("preserves all three zones when saving and reopening the deck", async ({
  page,
}) => {
  await dragCard(page, "main", 3, 0);
  await dragCard(page, "extra", 2, 0);
  await dragCard(page, "side", 2, 0);
  const expected = (await editorState(page)).deck;
  expect(expected.extra).toEqual([2000002, 2000003, 2000001]);
  expect(expected.side).toEqual([1000014, 1000012, 1000013]);
  await page.getByRole("button", { name: "保存到本地", exact: true }).click();
  await expect.poll(async () => (await editorState(page)).edited).toBe(false);
  await page.reload();
  await expect(page.getByTestId("deck-start-training")).toBeVisible();
  await page
    .getByRole("button", { name: initialDeck.deckName, exact: true })
    .click();
  for (const type of ["main", "extra", "side"] as const)
    await expectOrder(page, type, expected[type]);
  expect((await editorState(page)).edited).toBe(false);
});

test("keeps the custom order when adding, moving and removing a specific duplicate", async ({
  page,
}) => {
  const expected = [...initialDeck.main];
  await dragCard(page, "main", 2, 0);
  expected.splice(0, 0, expected.splice(2, 1)[0]);
  const sideRect = await zone(page, "side").boundingBox();
  await cards(page, "main")
    .first()
    .dragTo(zone(page, "side"), {
      targetPosition: { x: 24, y: sideRect!.height - 12 },
    });
  expected.shift();
  await expectOrder(page, "main", expected);
  await expectOrder(page, "side", [...initialDeck.side, 1000001]);
  await cards(page, "side").last().click({ button: "middle" });
  expected.push(1000001);
  await expectOrder(page, "main", expected);
  await expectOrder(page, "side", initialDeck.side);
  await cards(page, "main").last().click({ button: "right" });
  expected.pop();
  await expectOrder(page, "main", expected);
  const searchCard = page.locator(
    '[data-testid="deck-card"][data-card-source="search"][data-card-code="1000005"]',
  );
  await searchCard.first().click({ button: "right" });
  expected.push(1000005);
  await expectOrder(page, "main", expected);
  await page.getByRole("button", { name: /排\s*序$/ }).click();
  await expectOrder(
    page,
    "main",
    [...expected].sort((a, b) => a - b),
  );
  await page
    .getByRole("button", { name: /重\s*置$/ })
    .first()
    .click();
  await expectOrder(page, "main", initialDeck.main);
});

test.describe("touch dragging", () => {
  test.use({ hasTouch: true });

  test("inserts a card using touch input", async ({ page }) => {
    const session = await page.context().newCDPSession(page);
    const source = await cards(page, "main").nth(3).boundingBox();
    const target = await cards(page, "main").first().boundingBox();
    const start = {
      x: source!.x + source!.width / 2,
      y: source!.y + source!.height / 2,
    };
    const end = { x: target!.x + 2, y: target!.y + target!.height / 2 };
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [start],
    });
    for (let i = 1; i <= 10; i++) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            x: start.x + ((end.x - start.x) * i) / 10,
            y: start.y + ((end.y - start.y) * i) / 10,
          },
        ],
      });
    }
    await expect(cards(page, "main").first()).toHaveAttribute(
      "data-drop-position",
      "before",
    );
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    const expected = [...initialDeck.main];
    expected.unshift(expected.splice(3, 1)[0]);
    await expectOrder(page, "main", expected);
    expect((await editorState(page)).detailOpen).toBe(false);
    await session.detach();
  });
});
