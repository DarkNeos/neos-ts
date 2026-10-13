import { expect, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

let database: Buffer;
test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
  );
  database = Buffer.from(db.export());
  db.close();
});

test.beforeEach(async ({ page }) => {
  await page.route("**/*.cdb", (route) => route.fulfill({ body: database }));
  await page.route("**/*.conf", (route) =>
    route.fulfill({ body: "!system 1211 确认" }),
  );
  await page.route("**/test-release-v2.json", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/mdpro3/deck/list?*", (route) =>
    route.fulfill({ json: { code: 0, data: { total: 0, records: [] } } }),
  );
});

async function openRoom(page: Page) {
  await page.goto("/match");
  await page.getByTestId("match-mode-custom-room").click();
  await expect(page.getByTestId("match-modal-server-address")).toBeVisible();
}

async function selectServer(page: Page, name: string) {
  await page.getByTestId("match-modal-server").click();
  await page
    .locator(".ant-select-item-option")
    .filter({ hasText: name })
    .click();
}

test("shows preset addresses and remembers the custom address across reloads", async ({
  page,
}, info) => {
  await openRoom(page);
  const address = page.getByTestId("match-modal-server-address");
  const presets = await page.evaluate(async () => {
    const { useConfig } = await import("/src/config/index.ts");
    return useConfig().servers.map(
      (server) => new URL(`wss://${server.ip}:${server.port}`).href,
    );
  });
  await expect(address).toHaveValue(presets[0]);
  await expect(address).toHaveAttribute("readonly", "");
  await selectServer(page, "超先行服");
  await expect(address).toHaveValue(presets[3]);
  await selectServer(page, "408环境");
  await expect(address).toHaveValue(presets[4]);
  await selectServer(page, "自定义服务器");
  await expect(address).toBeEditable();
  await address.fill("wss://duel.example.test:2443/game");
  await selectServer(page, "Koishi服");
  await expect(address).toHaveValue(presets[0]);
  await openRoom(page);
  await selectServer(page, "自定义服务器");
  await expect(address).toHaveValue("wss://duel.example.test:2443/game");
  await page.screenshot({ path: info.outputPath("custom-server.png") });
});

test("validates custom addresses before connecting and uses the entered endpoint", async ({
  page,
}) => {
  const connections: string[] = [];
  await page.routeWebSocket(/wss?:\/\/duel\.example\.test[:/]/, (socket) => {
    connections.push(socket.url());
  });
  await openRoom(page);
  await selectServer(page, "自定义服务器");
  const address = page.getByTestId("match-modal-server-address");
  const join = page.getByTestId("match-modal-join");
  for (const invalid of [
    "",
    "https://duel.example.test",
    "ws://duel.example.test",
    "duel.example.test:99999",
  ]) {
    await address.fill(invalid);
    await join.click();
    await expect(address).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#match-server-address-error")).toBeVisible();
    expect(connections).toEqual([]);
  }
  await address.fill("  duel.example.test:2443/game?mode=test  ");
  await join.click();
  await expect
    .poll(() => connections)
    .toEqual(["wss://duel.example.test:2443/game?mode=test"]);
  await expect(address).toBeDisabled();
  await expect(page.locator("#match-server-address-error")).toHaveCount(0);
  await page.locator(".ant-modal-close").click();
});
