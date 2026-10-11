import { expect, test } from "@playwright/test";
import initSqlJs from "sql.js";

const firstCode = 1000001;
const lastCode = firstCode + 195;
const image = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="580"><rect width="400" height="580" fill="#b69573"/><rect x="36" y="100" width="328" height="300" fill="#446478"/></svg>`;
let database: Buffer;
let emptyDatabase: Buffer;

test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
  );
  for (let code = firstCode; code <= lastCode; code++) {
    db.run("INSERT INTO datas VALUES (?, 1)", [code]);
    db.run("INSERT INTO texts VALUES (?, ?, '')", [code, `测试卡${code}`]);
  }
  database = Buffer.from(db.export());
  db.run("DELETE FROM datas; DELETE FROM texts;");
  emptyDatabase = Buffer.from(db.export());
  db.close();
});

test("search images load near the viewport without changing card geometry or mouse actions", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/*.cdb", (route) =>
    route.fulfill({
      body: route.request().url().includes("test-release.cdb")
        ? emptyDatabase
        : database,
    }),
  );
  await page.route("**/*.conf", (route) =>
    route.fulfill({ body: "!system 1211 确认" }),
  );
  await page.route("**/test-release-v2.json", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/mdpro3/deck/list?*", (route) =>
    route.fulfill({ json: { code: 0, data: { total: 0, records: [] } } }),
  );
  const requested = new Set<number>();
  await page.route(/\/\d+\.webp$/, async (route) => {
    requested.add(
      Number(
        route
          .request()
          .url()
          .match(/\/(\d+)\.webp$/)![1],
      ),
    );
    await route.fulfill({ contentType: "image/svg+xml", body: image });
  });
  await page.goto("/build");
  const searchImages = page.locator('img[loading="lazy"]');
  await expect(searchImages).toHaveCount(196);
  const first = searchImages.first();
  const last = searchImages.last();
  await expect
    .poll(() => first.evaluate((node: HTMLImageElement) => node.naturalWidth))
    .toBe(400);
  expect(requested.has(lastCode)).toBe(false);
  const before = requested.size;
  await first.evaluate((node) => {
    const wrapper = node.parentElement!;
    const card = wrapper.parentElement!;
    if (card.querySelector('[class*="cardname"]'))
      throw new Error("Card name should disappear after image load");
    const a = node.getBoundingClientRect();
    const b = wrapper.getBoundingClientRect();
    if (Math.abs(a.width - b.width) > 1 || Math.abs(a.height - b.height) > 1)
      throw new Error("Image no longer fits its card");
    if ((node as HTMLImageElement).draggable)
      throw new Error("Native image dragging must stay disabled");
    if (getComputedStyle(node).pointerEvents !== "none")
      throw new Error("Image intercepts card gestures");
  });
  await first.locator("..").click({ button: "right" });
  await expect(
    page.locator(
      `[class*="card-continer"] img[loading="eager"][src$="/${firstCode}.webp"]`,
    ),
  ).toHaveCount(1);
  await last.scrollIntoViewIfNeeded();
  await expect.poll(() => requested.has(lastCode)).toBe(true);
  await expect
    .poll(() => last.evaluate((node: HTMLImageElement) => node.naturalWidth))
    .toBe(400);
  console.log(`Image requests before scrolling: ${before}; search cards: 196`);
  await page.screenshot({ path: info.outputPath("card-images.png") });
});
