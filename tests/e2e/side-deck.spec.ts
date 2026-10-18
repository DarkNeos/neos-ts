import { expect, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

type Zone = "main" | "extra" | "side";
const initialDeck = {
  deckName: "换 side 测试卡组",
  main: [1000001, 1000006, 1000001, 1000007, 1000008, 1000009],
  extra: [1000002, 1000003, 1000004, 1000005, 1000002, 1000010],
  side: Array.from({ length: 10 }, (_, i) => 1000001 + i),
};
let database: Buffer;

test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER, alias INTEGER DEFAULT 0); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
  );
  // 普通、融合、同调、超量、连接、普通灵摆、仪式、魔法、陷阱、融合灵摆。
  for (const [i, type] of [
    1, 0x41, 0x2001, 0x800001, 0x4000001, 0x1000001, 0x81, 2, 4, 0x1000041,
  ].entries()) {
    db.run("INSERT INTO datas (id, type) VALUES (?, ?)", [1000001 + i, type]);
    db.run("INSERT INTO texts VALUES (?, ?, '')", [
      1000001 + i,
      `换 side 测试卡 ${i}`,
    ]);
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
  await page.goto("/match");
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  await page.evaluate(async (deck) => {
    await (await import("/src/ui/Layout/utils.ts")).initializeApp();
    const { initUIContainer } = await import("/src/container/compat.ts");
    const { sideStore, SideStage } = await import("/src/stores/index.ts");
    window.__sent = [];
    initUIContainer({
      isClosed: () => false,
      close: () => {},
      ws: {
        readyState: WebSocket.OPEN,
        send: (data: Uint8Array) => window.__sent.push([...data]),
      },
    });
    sideStore.setSideDeck(deck);
    sideStore.stage = SideStage.SIDE_CHANGING;
    history.pushState({}, "", "/side");
    dispatchEvent(new PopStateEvent("popstate"));
  }, initialDeck);
  await expect(page.getByText("拖动或右键卡片更换副卡组")).toBeVisible();
  await expectDeck(page, initialDeck);
});

const zone = (page: Page, type: Zone) =>
  page.locator(`[data-testid="deck-zone"][data-deck-zone="${type}"]`);
const cards = (page: Page, type: Zone) =>
  zone(page, type).getByTestId("deck-card");

async function expectDeck(page: Page, expected: typeof initialDeck) {
  for (const type of ["main", "extra", "side"] as const) {
    await expect
      .poll(() =>
        cards(page, type).evaluateAll((nodes) =>
          nodes.map((node) => Number(node.getAttribute("data-card-code"))),
        ),
      )
      .toEqual(expected[type]);
  }
}

test("right click moves the chosen main and extra duplicates to side and reset restores them", async ({
  page,
}) => {
  await cards(page, "main").nth(2).click();
  await expectDeck(page, initialDeck);

  await cards(page, "main").nth(2).click({ button: "right" });
  const expected = structuredClone(initialDeck);
  expected.side.push(expected.main.splice(2, 1)[0]);
  await expectDeck(page, expected);

  await cards(page, "extra").nth(4).click({ button: "right" });
  expected.side.push(expected.extra.splice(4, 1)[0]);
  await expectDeck(page, expected);
  await page.getByRole("button", { name: /重\s*置/ }).click();
  await expectDeck(page, initialDeck);
});

test("right click returns side cards to main or extra according to their card types", async ({
  page,
}) => {
  const expected = structuredClone(initialDeck);
  const destinations: Zone[] = [
    "main",
    "extra",
    "extra",
    "extra",
    "extra",
    "main",
    "main",
    "main",
    "main",
    "extra",
  ];
  for (const destination of destinations) {
    await cards(page, "side").first().click({ button: "right" });
    expected[destination].push(expected.side.shift()!);
    await expectDeck(page, expected);
  }
});

test("dragging and right click can be mixed and confirmation submits the resulting deck", async ({
  page,
}) => {
  await cards(page, "main").nth(2).dragTo(cards(page, "extra").first());
  await expect(page.getByText("卡片种类不符合")).toBeVisible();
  await expectDeck(page, initialDeck);

  await cards(page, "main").nth(2).dragTo(cards(page, "side").first());
  const expected = structuredClone(initialDeck);
  expected.side.push(expected.main.splice(2, 1)[0]);
  await expectDeck(page, expected);
  await cards(page, "side").nth(5).click({ button: "right" });
  expected.main.push(expected.side.splice(5, 1)[0]);
  await expectDeck(page, expected);

  await page.getByRole("button", { name: /确\s*定/ }).click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("side_deck")!)),
  ).toEqual(expected);
  const sent = await page.evaluate(() => window.__sent);
  expect(sent).toHaveLength(1);
  const payload = Uint8Array.from(sent[0]);
  const view = new DataView(payload.buffer);
  const values = Array.from({ length: (payload.length - 3) / 4 }, (_, i) =>
    view.getUint32(3 + i * 4, true),
  );
  expect(values).toEqual([
    expected.main.length + expected.extra.length,
    expected.side.length,
    ...expected.main,
    ...expected.extra,
    ...expected.side,
  ]);
});
