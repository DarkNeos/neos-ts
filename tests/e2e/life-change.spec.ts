import { expect, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

let database: Buffer;
test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER, alias INTEGER DEFAULT 0); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
  );
  database = Buffer.from(db.export());
  db.close();
});

async function setup(page: Page, selfType = 1) {
  await page.addInitScript(() => {
    localStorage.setItem("language", "cn");
    localStorage.setItem(
      "__neo_setting_config__",
      JSON.stringify({ animation: { enabled: true, speed: 0.7 } }),
    );
  });
  await page.route("**/*.cdb", (route) => route.fulfill({ body: database }));
  await page.route("**/*.conf", (route) => route.fulfill({ body: "" }));
  await page.route("**/test-release-v2.json", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.goto("/match");
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  await page.evaluate(async (selfType) => {
    const { initializeApp } = await import("/src/ui/Layout/utils.ts");
    await initializeApp();
    const { initUIContainer, getUIContainer } = await import(
      "/src/container/compat.ts"
    );
    const { matStore, roomStore } = await import("/src/stores/index.ts");
    const { default: handle } = await import("/src/service/onSocketMessage.ts");
    initUIContainer({
      isClosed: () => false,
      close: () => {},
      ws: { readyState: WebSocket.OPEN, send: () => {} },
    });
    matStore.selfType = selfType;
    matStore.initInfo.set(0, { life: 8000 });
    matStore.initInfo.set(1, { life: 8000 });
    roomStore.players = [
      { name: "First player", isMe: selfType === 1, state: 0 },
      { name: "Second player", isMe: selfType === 2, state: 0 },
    ];
    window.__lifeCompleted = [];
    window.__lifeWire = (message: number, player: number, value: number) => {
      const wire = new Uint8Array(9);
      const view = new DataView(wire.buffer);
      view.setUint16(0, 7, true);
      wire.set([1, message, player], 2);
      view.setUint32(5, value, true);
      return handle(
        getUIContainer(),
        new MessageEvent("message", { data: wire.buffer }),
      ).then(() => window.__lifeCompleted.push(message));
    };
    history.pushState({}, "", "/duel");
    dispatchEvent(new PopStateEvent("popstate"));
  }, selfType);
  await expect(page.getByTestId("duel-toolbar")).toBeVisible();
  await expect(life(page, "me")).toHaveText("8000");
  await expect(life(page, "op")).toHaveText("8000");
  await page.clock.install({ time: new Date("2026-09-30T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-30T00:00:01Z"));
}

const life = (page: Page, player: "me" | "op") =>
  page.locator(
    `[data-testid="duel-player-life-value"][data-player="${player}"]`,
  );
const send = (page: Page, message: number, player: number, value: number) =>
  page.evaluate(
    ({ message, player, value }) => {
      void window.__lifeWire(message, player, value);
    },
    { message, player, value },
  );
const completed = (page: Page) =>
  page.evaluate(() => window.__lifeCompleted as number[]);
const freezeEffect = (page: Page) =>
  page.getByTestId("duel-life-change").evaluate((element) => {
    for (const animation of element.getAnimations({ subtree: true })) {
      animation.pause();
      animation.currentTime = 300;
    }
  });

test("damage and recovery show their amount on the affected side and wait in protocol order", async ({
  page,
}, info) => {
  await setup(page);
  const change = page.getByTestId("duel-life-change");
  await expect(change).toHaveCount(0);
  await send(page, 91, 0, 1500);
  await expect(change).toHaveAttribute("data-player", "me");
  await expect(change).toHaveAttribute("data-kind", "damage");
  await expect(change.getByRole("status")).toHaveText("−1500");
  await expect(change.getByRole("status")).toHaveCSS(
    "color",
    "rgb(255, 87, 87)",
  );
  await expect(page.getByTestId("duel-life-damage-flash")).toBeVisible();
  await expect(change).toHaveCSS("pointer-events", "none");
  await expect.poll(() => completed(page)).toEqual([]);
  await send(page, 92, 1, 500);
  await page.clock.runFor(250);
  const rolling = Number(await life(page, "me").textContent());
  expect(rolling).toBeGreaterThan(6500);
  expect(rolling).toBeLessThan(8000);
  await expect(life(page, "op")).toHaveText("8000");
  const damageNumber = (await change.getByRole("status").boundingBox())!;
  expect(damageNumber.y).toBeGreaterThan(page.viewportSize()!.height / 2);
  await freezeEffect(page);
  await page.screenshot({ path: info.outputPath("damage.png") });
  await page.clock.runFor(800);
  await expect(change).toHaveAttribute("data-player", "op");
  await expect(change).toHaveAttribute("data-kind", "recover");
  await expect(change.getByRole("status")).toHaveText("+500");
  await expect(change.getByRole("status")).toHaveCSS(
    "color",
    "rgb(101, 238, 149)",
  );
  await expect(page.getByTestId("duel-life-damage-flash")).toHaveCount(0);
  await expect(life(page, "me")).toHaveText("6500");
  await expect.poll(() => completed(page)).toEqual([91]);
  await page.clock.runFor(250);
  const recoveryNumber = (await change.getByRole("status").boundingBox())!;
  expect(recoveryNumber.y + recoveryNumber.height).toBeLessThan(
    page.viewportSize()!.height / 2,
  );
  await freezeEffect(page);
  await page.screenshot({ path: info.outputPath("recovery.png") });
  await page.clock.runFor(800);
  await expect(change).toHaveCount(0);
  await expect(life(page, "op")).toHaveText("8500");
  await expect.poll(() => completed(page)).toEqual([91, 92]);
});

for (const selfType of [2, 3]) {
  test(`player view ${selfType} maps damage and LP costs to the correct side on mobile`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await setup(page, selfType);
    const change = page.getByTestId("duel-life-change");
    const side = selfType === 2 ? "op" : "me";
    await send(page, 100, 0, 1000);
    await expect(change).toHaveAttribute("data-player", side);
    await expect(change.getByRole("status")).toHaveText("−1000");
    await page.clock.runFor(250);
    const box = (await change.getByRole("status").boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(844);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(390);
    await page.clock.runFor(800);
    await expect(life(page, side)).toHaveText("7000");
    await send(page, 91, 0, 9000);
    await expect(change.getByRole("status")).toHaveText("−9000");
    await page.clock.runFor(1050);
    await expect(life(page, side)).toHaveText("0");
    await expect(life(page, side === "me" ? "op" : "me")).toHaveText("8000");
  });
}

test("disabling animation during a change finishes it and later updates remain immediate", async ({
  page,
}) => {
  await setup(page);
  await send(page, 91, 0, 1000);
  await expect(page.getByTestId("duel-life-change")).toHaveCount(1);
  await page.evaluate(async () => {
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    settingStore.animation.enabled = false;
  });
  await page.clock.runFor(16);
  await expect(page.getByTestId("duel-life-change")).toHaveCount(0);
  await expect(life(page, "me")).toHaveText("7000");
  await expect.poll(() => completed(page)).toEqual([91]);
  await send(page, 92, 0, 500);
  await page.clock.runFor(16);
  await expect(life(page, "me")).toHaveText("7500");
  await expect.poll(() => completed(page)).toEqual([91, 92]);
  await send(page, 94, 0, 4000);
  await page.clock.runFor(16);
  await expect(life(page, "me")).toHaveText("4000");
  await expect(page.getByTestId("duel-life-change")).toHaveCount(0);
});

test("backgrounding, disconnecting and leaving the duel release the animation wait", async ({
  page,
}) => {
  await setup(page);
  const change = page.getByTestId("duel-life-change");
  await send(page, 91, 0, 1000);
  await expect(change).toHaveCount(1);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(change).toHaveCount(0);
  await expect(life(page, "me")).toHaveText("7000");
  await expect.poll(() => completed(page)).toEqual([91]);
  await send(page, 92, 0, 500);
  await expect(life(page, "me")).toHaveText("7500");
  await expect(change).toHaveCount(0);
  await page.evaluate(() => {
    delete (document as { hidden?: boolean }).hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await send(page, 91, 1, 1000);
  await expect(change).toHaveCount(1);
  await page.evaluate(async () => {
    const { resetDuelDialogs } = await import("/src/stores/duelDialogs.ts");
    resetDuelDialogs(true);
  });
  await expect(change).toHaveCount(0);
  await expect.poll(() => completed(page)).toEqual([91, 92, 91]);
  await send(page, 92, 1, 500);
  await expect(change).toHaveCount(1);
  await page.evaluate(() => {
    history.pushState({}, "", "/match");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  await expect(change).toHaveCount(0);
  await expect.poll(() => completed(page)).toEqual([91, 92, 91, 92]);
});

test("zero changes and LP synchronization do not show damage or recovery, replay changes do", async ({
  page,
}) => {
  await setup(page);
  await send(page, 91, 0, 0);
  await send(page, 94, 0, 5000);
  await expect(page.getByTestId("duel-life-change")).toHaveCount(0);
  await page.clock.runFor(600);
  await expect(life(page, "me")).toHaveText("5000");
  await page.evaluate(async () => {
    const { replayStore } = await import("/src/stores/index.ts");
    replayStore.isReplay = true;
  });
  await send(page, 92, 0, 1000);
  await expect(page.getByTestId("duel-life-change")).toHaveAttribute(
    "data-player",
    "me",
  );
  await expect(
    page.getByTestId("duel-life-change").getByRole("status"),
  ).toHaveText("+1000");
  await page.clock.runFor(1050);
  await expect(life(page, "me")).toHaveText("6000");
});
