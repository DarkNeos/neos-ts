import { expect, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

import { serverReplayPayload } from "./helpers/serverReplay";

let database: Buffer;
test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER, alias INTEGER DEFAULT 0); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
  );
  db.run(
    "INSERT INTO datas (id, type) VALUES (1000001, 1); INSERT INTO texts VALUES (1000001, '圣月之魔导士 恩底弥翁', '');",
  );
  database = Buffer.from(db.export());
  db.close();
});

async function resources(page: Page) {
  await page.route("**/*.cdb", (route) => route.fulfill({ body: database }));
  await page.route("**/*.conf", (route) =>
    route.fulfill({
      body: "!system 1211 确认\n!system 1295 取消\n!system 1000 卡组\n!system 1001 手牌\n!system 1002 怪兽区\n!system 1003 魔陷区\n!system 1004 墓地\n!system 1153 盖放",
    }),
  );
  await page.route("**/test-release-v2.json", (route) =>
    route.fulfill({ json: [] }),
  );
}
async function setup(page: Page) {
  await resources(page);
  await page.goto("/match");
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  await page.evaluate(async () => {
    const { initializeApp } = await import("/src/ui/Layout/utils.ts");
    await initializeApp();
    const { initUIContainer } = await import("/src/container/compat.ts");
    const { matStore } = await import("/src/stores/index.ts");
    window.__sent = [];
    initUIContainer({
      isClosed: () => false,
      close: () => {},
      ws: {
        readyState: WebSocket.OPEN,
        send: (data: Uint8Array) => window.__sent.push([...data]),
      },
    });
    matStore.selfType = 1;
    matStore.currentPlayer = 0;
    history.pushState({}, "", "/duel");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByTestId("duel-toolbar")).toBeVisible();
  await page.waitForTimeout(1100);
}

async function openSelection(page: Page, max = 1) {
  await page.evaluate(async (max) => {
    const { displaySimpleSelectCardsModal } = await import(
      "/src/ui/Duel/Message/SimpleSelectCardsModal/index.tsx"
    );
    const { ygopro } = await import("/src/api/index.ts");
    window.__selected = null;
    const cards = [89631139, 46986414, 15025844].map((code, index) => ({
      meta: { id: code, data: {}, text: { name: `Card ${index}` } },
      location: new ygopro.CardLocation({
        controller: 0,
        zone: index === 2 ? ygopro.CardZone.GRAVE : ygopro.CardZone.HAND,
        sequence: index,
      }),
      response: index,
    }));
    if (max > 1) {
      const { displaySelectActionsModal } = await import(
        "/src/ui/Duel/Message/SelectActionsModal/index.tsx"
      );
      void displaySelectActionsModal({ min: 2, max, selectables: cards });
      return;
    }
    void displaySimpleSelectCardsModal({ selectables: cards }).then(
      (result) => {
        window.__selected = result.map((c) => c.response);
      },
    );
  }, max);
}

test("single selection replaces the previous card within and across zones", async ({
  page,
}) => {
  await setup(page);
  await openSelection(page);
  const options = page.getByTestId("duel-select-card-option");
  await options.nth(0).click();
  await options.nth(1).click();
  await expect(options.nth(0).locator(".ant-pro-checkcard")).not.toHaveClass(
    /checked/,
  );
  await expect(options.nth(1).locator(".ant-pro-checkcard")).toHaveClass(
    /checked/,
  );
  await expect(
    page.locator('[data-testid="duel-select-card-submit"]:visible'),
  ).toBeEnabled();
  await page
    .locator('[data-testid="duel-select-card-group"][data-card-zone="GRAVE"]')
    .getByTestId("duel-select-card-option")
    .click();
  await page.locator('[data-testid="duel-select-card-submit"]:visible').click();
  await expect.poll(() => page.evaluate(() => window.__selected)).toEqual([2]);
});

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`mixed-zone rows scroll independently and submit cross-zone choices at ${viewport.width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport);
    await setup(page);
    await page.route("**/1000001.webp", (route) =>
      route.fulfill({ path: "neos-assets/card_back.webp" }),
    );
    await page.evaluate(async () => {
      const { displaySelectActionsModal } = await import(
        "/src/ui/Duel/Message/SelectActionsModal/index.tsx"
      );
      const { ygopro } = await import("/src/api/index.ts");
      const cards = [
        ygopro.CardZone.DECK,
        ygopro.CardZone.HAND,
        ygopro.CardZone.GRAVE,
      ].flatMap((zone, group) =>
        Array.from({ length: 9 }, (_, sequence) => ({
          meta: { id: 1000001, data: {}, text: { name: "候选卡" } },
          location: new ygopro.CardLocation({
            controller: 0,
            zone,
            sequence,
          }),
          response: group * 9 + sequence,
        })),
      );
      void displaySelectActionsModal({ min: 3, max: 3, selectables: cards });
    });

    const groups = page.getByTestId("duel-select-card-group");
    await expect(groups).toHaveCount(3);
    await expect(groups.nth(0).getByRole("heading")).toHaveText("卡组");
    await expect(groups.nth(1).getByRole("heading")).toHaveText("手牌");
    await expect(groups.nth(2).getByRole("heading")).toHaveText("墓地");
    const bounds = await groups.evaluateAll((rows) =>
      rows.map((row) => {
        const box = row.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom };
      }),
    );
    expect(bounds[1].top).toBeGreaterThan(bounds[0].bottom);
    expect(bounds[2].top).toBeGreaterThan(bounds[1].bottom);
    const rows = page.getByTestId("duel-select-card-row");
    const scrollViewports = rows.locator("[data-overlayscrollbars-viewport]");
    for (const row of await rows.all()) {
      expect(
        await row
          .locator("[data-overlayscrollbars-viewport]")
          .evaluate((el) => el.scrollWidth > el.clientWidth),
      ).toBe(true);
      const cardTops = await row
        .getByTestId("duel-select-card-option")
        .evaluateAll((cards) =>
          cards.map((card) => card.getBoundingClientRect().top),
        );
      expect(new Set(cardTops).size).toBe(1);
    }

    await expect(groups.getByRole("button")).toHaveCount(0);
    const handle = groups
      .nth(0)
      .locator(".os-scrollbar-horizontal .os-scrollbar-handle");
    await expect(handle).toBeVisible();
    await handle.hover();
    const start = (await handle.boundingBox())!;
    const dragX = start.x + start.width / 2;
    const dragY = start.y + start.height / 2;
    await page.mouse.move(dragX, dragY);
    await page.mouse.down();
    await page.mouse.move(dragX + 60, dragY, { steps: 6 });
    await page.mouse.up();
    await expect
      .poll(() => scrollViewports.nth(0).evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(0);
    expect(await scrollViewports.nth(1).evaluate((el) => el.scrollLeft)).toBe(
      0,
    );
    expect(await scrollViewports.nth(2).evaluate((el) => el.scrollLeft)).toBe(
      0,
    );
    const shifted = (await handle.boundingBox())!;
    const shiftedX = shifted.x + shifted.width / 2;
    await page.mouse.move(shiftedX, dragY);
    await page.mouse.down();
    await page.mouse.move(shiftedX - 80, dragY, { steps: 6 });
    await page.mouse.up();
    await expect
      .poll(() => scrollViewports.nth(0).evaluate((el) => el.scrollLeft))
      .toBe(0);

    await groups.nth(0).getByTestId("duel-select-card-option").nth(5).click();
    const submit = page.locator(
      '[data-testid="duel-select-card-submit"]:visible',
    );
    await expect(submit).toBeDisabled();
    await groups.nth(1).getByTestId("duel-select-card-option").nth(1).click();
    await expect(submit).toBeDisabled();
    await groups.nth(2).getByTestId("duel-select-card-option").first().click();
    await expect(submit).toBeEnabled();
    await expect(groups.locator(".ant-pro-checkcard-checked")).toHaveCount(3);
    await page.screenshot({
      path: info.outputPath("mixed-zone-selection.png"),
    });
    await submit.click();
    expect(await page.evaluate(() => window.__sent.at(-1).slice(3))).toEqual([
      3, 5, 10, 18,
    ]);
  });
}

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`operation history keeps its scrollbar visible and follows appended actions at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await setup(page);
    await page.route("**/1000001.webp", (route) =>
      route.fulfill({ path: "neos-assets/card_back.webp" }),
    );
    await page.evaluate(async () => {
      const { getUIContainer } = await import("/src/container/compat.ts");
      const { historyStore } = await import("/src/stores/index.ts");
      const { ygopro } = await import("/src/api/index.ts");
      const { displayActionHistory } = await import(
        "/src/ui/Duel/Message/ActionHistory/index.tsx"
      );
      const context = getUIContainer().context;
      const from = new ygopro.CardLocation({
        controller: 0,
        zone: ygopro.CardZone.HAND,
        sequence: 0,
      });
      historyStore.reset();
      for (let i = 0; i < 20; i++) {
        historyStore.putMove(
          context,
          1000001,
          from,
          new ygopro.CardLocation({
            controller: 0,
            zone: ygopro.CardZone.GRAVE,
            sequence: i,
          }),
        );
      }
      displayActionHistory();
    });

    const drawer = page.getByTestId("duel-history-drawer");
    const scrollViewport = drawer.locator("[data-overlayscrollbars-viewport]");
    const distanceFromBottom = () =>
      scrollViewport.evaluate(
        (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
      );
    await expect(drawer.getByText("移动", { exact: true })).toHaveCount(20);
    await expect(drawer.locator(".os-scrollbar-vertical")).toHaveCSS(
      "opacity",
      "1",
    );
    await expect.poll(distanceFromBottom).toBeLessThanOrEqual(1);
    expect(await scrollViewport.evaluate((el) => el.scrollTop)).toBeGreaterThan(
      0,
    );

    const box = (await scrollViewport.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -500);
    await expect.poll(distanceFromBottom).toBeGreaterThan(200);
    await page.evaluate(async () => {
      const { getUIContainer } = await import("/src/container/compat.ts");
      const { historyStore } = await import("/src/stores/index.ts");
      const { ygopro } = await import("/src/api/index.ts");
      historyStore.putTargeted(
        getUIContainer().context,
        1000001,
        new ygopro.CardLocation({
          controller: 0,
          zone: ygopro.CardZone.MZONE,
          sequence: 0,
        }),
      );
    });
    await expect(
      drawer.getByText("被取对象", { exact: true }),
    ).toBeInViewport();
    await expect.poll(distanceFromBottom).toBeLessThanOrEqual(1);

    await drawer.getByRole("button", { name: "Close" }).click();
    await expect(drawer).toBeHidden();
    await page.evaluate(async () => {
      const { getUIContainer } = await import("/src/container/compat.ts");
      const { historyStore } = await import("/src/stores/index.ts");
      const { ygopro } = await import("/src/api/index.ts");
      const { displayActionHistory } = await import(
        "/src/ui/Duel/Message/ActionHistory/index.tsx"
      );
      historyStore.putConfirmed(
        getUIContainer().context,
        1000001,
        new ygopro.CardLocation({
          controller: 0,
          zone: ygopro.CardZone.HAND,
          sequence: 0,
        }),
      );
      displayActionHistory();
    });
    await expect(drawer.getByText("展示", { exact: true })).toBeInViewport();
    await expect.poll(distanceFromBottom).toBeLessThanOrEqual(1);
    await page.evaluate(async () => {
      const { historyStore } = await import("/src/stores/index.ts");
      historyStore.reset();
    });
    await expect(drawer.getByText("移动", { exact: true })).toHaveCount(0);
    await expect(drawer.getByText("展示", { exact: true })).toHaveCount(0);
    await expect
      .poll(() => scrollViewport.evaluate((el) => el.scrollTop))
      .toBe(0);
  });
}

for (const width of [1440, 390, 320]) {
  test(`set history preserves the original slot and follows the field perspective at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 844 });
    await setup(page);
    await page.route("**/1000001.webp", (route) =>
      route.fulfill({ path: "neos-assets/card_back.webp" }),
    );
    await page.evaluate(async () => {
      const { getUIContainer } = await import("/src/container/compat.ts");
      const { historyStore } = await import("/src/stores/index.ts");
      const { ygopro } = await import("/src/api/index.ts");
      const { default: set } = await import("/src/service/duel/set.ts");
      const { displayActionHistory } = await import(
        "/src/ui/Duel/Message/ActionHistory/index.tsx"
      );
      historyStore.reset();
      for (const [controller, zone, sequence, code] of [
        [0, ygopro.CardZone.SZONE, 1, 1000001],
        [1, ygopro.CardZone.SZONE, 0, 0],
        [0, ygopro.CardZone.SZONE, 5, 1000001],
        [0, ygopro.CardZone.MZONE, 3, 1000001],
      ]) {
        const location = new ygopro.CardLocation({
          controller,
          zone,
          sequence,
          position: ygopro.CardPosition.FACEDOWN_ATTACK,
        });
        set(getUIContainer(), { code, location });
        // 卡片后续移位，不应改变盖放记录中的位置。
        location.sequence = 4;
      }
      displayActionHistory();
    });

    const drawer = page.getByTestId("duel-history-drawer");
    const items = drawer.getByTestId("duel-history-item");
    await expect(items).toHaveCount(4);
    const own = items.nth(0).getByTestId("duel-history-location");
    const unknown = items.nth(1).getByTestId("duel-history-location");
    await expect(own).toHaveAttribute("aria-label", "我方魔陷区，从左第 2 格");
    await expect(own.locator("i").nth(1)).toHaveAttribute(
      "data-active",
      "true",
    );
    await expect(unknown).toHaveAttribute(
      "aria-label",
      "对方魔陷区，从左第 5 格",
    );
    await expect(unknown.locator("i").nth(4)).toHaveAttribute(
      "data-active",
      "true",
    );
    await expect(
      items.nth(2).getByText("场地区", { exact: true }),
    ).toBeVisible();
    await expect(items.nth(2).locator("i")).toHaveCount(0);
    await expect(
      items.nth(3).getByTestId("duel-history-location"),
    ).toHaveAttribute("aria-label", "我方怪兽区，从左第 4 格");
    await expect(page.locator(".ant-drawer-content-wrapper")).toHaveCSS(
      "transform",
      "none",
    );
    expect(
      await page.evaluate(async () => {
        const { historyStore } = await import("/src/stores/index.ts");
        return historyStore.historys.map((entry) => [
          entry.card,
          entry.target.sequence,
        ]);
      }),
    ).toEqual([
      [1000001, 1],
      [0, 0],
      [1000001, 5],
      [1000001, 3],
    ]);
    for (const item of await items.all()) {
      expect(
        await item.evaluate((node) => node.scrollWidth - node.clientWidth),
      ).toBeLessThanOrEqual(1);
      const box = (await item.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    await page.screenshot({
      path: info.outputPath("set-history-position.png"),
    });

    await page.evaluate(async () => {
      const { matStore } = await import("/src/stores/index.ts");
      matStore.selfType = 2;
    });
    await expect(own).toHaveAttribute("aria-label", "对方魔陷区，从左第 4 格");
    await expect(own.locator("i").nth(3)).toHaveAttribute(
      "data-active",
      "true",
    );
    await expect(unknown).toHaveAttribute(
      "aria-label",
      "我方魔陷区，从左第 1 格",
    );
  });
}

test("right drawers leave the toolbar visible and clickable after resizing", async ({
  page,
}, info) => {
  await setup(page);
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(async () => {
      const { displayCardListModal } = await import(
        "/src/ui/Duel/Message/CardListModal/index.tsx"
      );
      displayCardListModal({ isZone: true, zone: 4, controller: 0 });
    });
    const drawer = page.getByTestId("duel-card-list-drawer");
    await expect(drawer).toBeVisible();
    await expect
      .poll(async () => {
        const bar = (await page.getByTestId("duel-toolbar").boundingBox())!;
        const box = (await drawer.boundingBox())!;
        return box.y + box.height < bar.y;
      })
      .toBe(true);
    await page.getByTestId("duel-surrender").click();
    await expect(page.getByTestId("duel-surrender-confirm")).toBeVisible();
    await page.keyboard.press("Escape");
    await drawer.getByRole("button", { name: "Close" }).click();
  }
  await page.evaluate(async () => {
    const { displayActionHistory } = await import(
      "/src/ui/Duel/Message/ActionHistory/index.tsx"
    );
    displayActionHistory();
  });
  const historyDrawer = page.getByTestId("duel-history-drawer");
  await expect(historyDrawer).toBeVisible();
  const bar = (await page.getByTestId("duel-toolbar").boundingBox())!;
  const box = (await historyDrawer.boundingBox())!;
  expect(box.y + box.height).toBeLessThan(bar.y);
  await page.screenshot({ path: info.outputPath("sidebar-toolbar.png") });
});

test("only the server's active player counts down, including background time, and sending a response stops it", async ({
  page,
}) => {
  await setup(page);
  await page.clock.install();
  await page.evaluate(async () => {
    const { matStore } = await import("/src/stores/index.ts");
    matStore.timeLimits.set(0, 120);
    matStore.timeLimits.set(1, 90);
  });
  const me = page.locator(
    '[data-testid="duel-player-timer"][data-player="me"]',
  );
  const op = page.locator(
    '[data-testid="duel-player-timer"][data-player="op"]',
  );
  await page.clock.fastForward(5000);
  await expect(me.getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "02:00",
  );
  await expect(me).toHaveAttribute("data-active", "false");
  await expect(op.getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "01:25",
  );
  await expect(op).toHaveAttribute("data-active", "true");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(20_000);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(op.getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "01:05",
  );
  await expect(op).toHaveAttribute("data-active", "true");
  await page.evaluate(async () => {
    const { matStore } = await import("/src/stores/index.ts");
    const { sendSocketData } = await import("/src/middleware/socket.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    matStore.timeLimits.set(0, 80);
    sendSocketData(
      getUIContainer().conn,
      new Uint8Array([5, 0, 1, 0, 0, 0, 0]),
    );
  });
  await page.clock.fastForward(10_000);
  await expect(me.getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "01:20",
  );
  await expect(op.getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "01:05",
  );
  await expect(me).toHaveAttribute("data-active", "false");
  await expect(op).toHaveAttribute("data-active", "false");
});

test("initialization failure is shown and retry shares one load then succeeds", async ({
  page,
}) => {
  await resources(page);
  let attempts = 0;
  let fail = true;
  await page.route("**/sql-wasm.wasm", async (route) => {
    attempts += 1;
    if (fail) await route.fulfill({ status: 503, body: "unavailable" });
    else await route.continue();
  });
  await page.goto("/match");
  await expect(page.getByTestId("connection-status")).toContainText(
    "资源初始化失败",
  );
  expect(attempts).toBe(1);
  fail = false;
  await page.getByRole("button", { name: "重新加载资源" }).click();
  await page.evaluate(async () => {
    const { initializeApp } = await import("/src/ui/Layout/utils.ts");
    await Promise.all([initializeApp(), initializeApp()]);
  });
  await expect(page.getByTestId("connection-status")).not.toBeVisible();
  expect(attempts).toBe(2);
});

test("connection timeout and retry, background return and server disconnect have explicit states", async ({
  page,
}) => {
  await setup(page);
  await page.clock.install();
  await page.evaluate(async () => {
    const { connectSrvpro } = await import("/src/ui/Match/util.ts");
    class FakeSocket extends EventTarget {
      static OPEN = 1;
      static CLOSED = 3;
      static CLOSING = 2;
      readyState = 0;
      binaryType = "arraybuffer";
      onopen: Function;
      onclose: Function;
      onerror: Function;
      onmessage: Function;
      constructor(public url: string) {
        super();
        window.__socket = this;
      }
      send() {}
      close() {
        if (this.readyState === 3) return;
        this.readyState = 3;
        queueMicrotask(() => this.onclose?.(new Event("close")));
      }
    }
    window.WebSocket = FakeSocket;
    window.__connect = () =>
      connectSrvpro({
        ip: "test.invalid:1234",
        player: "Test",
        passWd: "",
      }).catch((error) => {
        window.__connectError = error.message;
      });
    void window.__connect();
  });
  await expect(page.getByTestId("connection-status")).toHaveAttribute(
    "data-phase",
    "connecting",
  );
  await page.clock.fastForward(15_001);
  await expect(page.getByTestId("connection-status")).toContainText("连接超时");
  await page.evaluate(() => {
    void window.__connect();
  });
  await expect(page.getByTestId("connection-status")).toHaveAttribute(
    "data-phase",
    "connecting",
  );
  await page.evaluate(() => {
    window.__socket.readyState = 1;
    window.__socket.onopen(new Event("open"));
  });
  await expect(page.getByTestId("connection-status")).toHaveAttribute(
    "data-phase",
    "joining",
  );
  await page.evaluate(() => {
    window.__socket.onmessage(
      new MessageEvent("message", { data: new Uint8Array([1, 0, 18]).buffer }),
    );
  });
  await expect(page.getByTestId("connection-status")).not.toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByTestId("connection-status")).toContainText(
    "已返回对局",
  );
  await page.evaluate(async () => {
    const { displayYesNoModal } = await import(
      "/src/ui/Duel/Message/YesNoModal/index.tsx"
    );
    void displayYesNoModal("断线前的选择");
  });
  await expect(page.getByText("断线前的选择", { exact: true })).toBeVisible();
  await page.evaluate(() => {
    window.__socket.readyState = 3;
    window.__socket.onclose(new Event("close"));
  });
  await expect(page.getByTestId("connection-status")).toHaveAttribute(
    "data-phase",
    "disconnected",
  );
  await expect(page.getByRole("button", { name: "返回大厅" })).toBeVisible();
  await expect(
    page.getByText("断线前的选择", { exact: true }),
  ).not.toBeVisible();
});

test("card images and the local card back load as WebP", async ({ page }) => {
  await setup(page);
  const result = await page.evaluate(async () => {
    const { getCardImgUrl } = await import("/src/api/index.ts");
    return [
      getCardImgUrl(46986414),
      getCardImgUrl(0),
      getCardImgUrl(46986414, true),
    ];
  });
  expect(result.every((url) => url.endsWith(".webp"))).toBe(true);
  const response = await page.request.get(result[1]);
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/webp");
});

test("multi-card prompts still keep multiple selections", async ({ page }) => {
  await setup(page);
  await openSelection(page, 2);
  const options = page.getByTestId("duel-select-card-option");
  await options.nth(0).click();
  await options.nth(1).click();
  await expect(options.locator(".ant-pro-checkcard-checked")).toHaveCount(2);
  await page.locator('[data-testid="duel-select-card-submit"]:visible').click();
  expect(await page.evaluate(() => window.__sent.at(-1).slice(3))).toEqual([
    2, 0, 1,
  ]);
});

test("disconnect clears pending dialogs and drawers without closing the next game's prompt", async ({
  page,
}) => {
  await setup(page);
  await openSelection(page);
  await page.evaluate(async () => {
    const { displayYesNoModal } = await import(
      "/src/ui/Duel/Message/YesNoModal/index.tsx"
    );
    const { displayActionHistory } = await import(
      "/src/ui/Duel/Message/ActionHistory/index.tsx"
    );
    window.__oldPromptFinished = false;
    void displayYesNoModal("上一局的选择").then(() => {
      window.__oldPromptFinished = true;
    });
    displayActionHistory();
  });
  await expect(page.getByText("上一局的选择", { exact: true })).toBeVisible();
  await page.evaluate(async () => {
    const { disconnectSession } = await import("/src/ui/Match/util.ts");
    const { displayYesNoModal } = await import(
      "/src/ui/Duel/Message/YesNoModal/index.tsx"
    );
    disconnectSession();
    // 在旧 Promise 的 continuation 执行前打开新提示，防止旧清理误关新弹窗。
    window.__newPromptFinished = false;
    void displayYesNoModal("新一局的选择").then(() => {
      window.__newPromptFinished = true;
    });
  });
  await expect(
    page.getByText("上一局的选择", { exact: true }),
  ).not.toBeVisible();
  await expect(
    page.locator('[data-testid="duel-select-cards-modal"]:visible'),
  ).toHaveCount(0);
  await expect(page.getByTestId("duel-history-drawer")).not.toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.__oldPromptFinished))
    .toBe(true);
  await expect.poll(() => page.evaluate(() => window.__selected)).toEqual([]);
  await expect(page.getByText("新一局的选择", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__newPromptFinished)).toBe(false);
  expect(await page.evaluate(() => window.__sent)).toEqual([]);
  await page.getByTestId("duel-yesno-yes").click();
  await expect
    .poll(() => page.evaluate(() => window.__newPromptFinished))
    .toBe(true);
  expect(await page.evaluate(() => window.__sent.length)).toBe(1);
});

test("duel result replaces pending choices and is cleared on returning to the lobby", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { displayYesNoModal } = await import(
      "/src/ui/Duel/Message/YesNoModal/index.tsx"
    );
    void displayYesNoModal("尚未完成的发动确认");
    const { default: win } = await import("/src/service/duel/win.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    window.__winFinished = false;
    void win(getUIContainer(), { win_player: 0, reason: 0 }).then(() => {
      window.__winFinished = true;
    });
  });
  await expect(page.getByTestId("duel-end-modal")).toBeVisible();
  await expect(
    page.getByText("尚未完成的发动确认", { exact: true }),
  ).not.toBeVisible();
  await page.evaluate(() => {
    history.pushState({}, "", "/match");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__winFinished)).toBe(true);
  await page.evaluate(() => {
    history.pushState({}, "", "/duel");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByTestId("duel-toolbar")).toBeVisible();
  await page.waitForTimeout(1200);
  await expect(page.getByTestId("duel-end-modal")).not.toBeVisible();
  await expect(
    page.locator('[data-testid="duel-yesno-modal"]:visible'),
  ).toHaveCount(0);
});

test("time bars remain visible before synchronization and use the room limit and server countdown", async ({
  page,
}, info) => {
  await setup(page);
  const timers = page.getByTestId("duel-player-timer");
  await expect(timers).toHaveCount(2);
  await expect(timers.nth(0).getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "未同步",
  );
  await expect(timers.nth(1).getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "未同步",
  );
  await page.evaluate(async () => {
    const { default: handleSocketMessage } = await import(
      "/src/service/onSocketMessage.ts"
    );
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { matStore, roomStore } = await import("/src/stores/index.ts");
    roomStore.players = [
      { name: "我方", isMe: true },
      { name: "对方", isMe: false },
    ];
    matStore.initInfo.set(0, { life: 8000 });
    matStore.initInfo.set(1, { life: 8000 });
    const packet = new Uint8Array(23);
    packet.set([21, 0, 18]);
    new DataView(packet.buffer).setUint16(21, 180, true);
    await handleSocketMessage(
      getUIContainer(),
      new MessageEvent("message", { data: packet.buffer }),
    );
  });
  for (const timer of await timers.all()) {
    await expect(timer.getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "03:00",
    );
    await expect(timer).toHaveAttribute("data-active", "false");
  }
  await page.clock.install();
  await page.evaluate(async () => {
    const { default: handleSocketMessage } = await import(
      "/src/service/onSocketMessage.ts"
    );
    const { getUIContainer } = await import("/src/container/compat.ts");
    await handleSocketMessage(
      getUIContainer(),
      new MessageEvent("message", {
        data: new Uint8Array([5, 0, 24, 0, 0, 120, 0]).buffer,
      }),
    );
  });
  await page.clock.fastForward(5000);
  const me = page.locator(
    '[data-testid="duel-player-timer"][data-player="me"]',
  );
  const op = page.locator(
    '[data-testid="duel-player-timer"][data-player="op"]',
  );
  await expect(me.getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "01:55",
  );
  await expect(op.getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "03:00",
  );
  await expect(me.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "115",
  );
  await expect(me.getByRole("progressbar")).toHaveAttribute(
    "aria-valuemax",
    "180",
  );
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    for (const timer of await timers.all()) {
      await expect(timer).toBeInViewport();
      const rect = await timer.boundingBox();
      expect(rect!.width).toBeGreaterThanOrEqual(136);
      const bar = await timer.getByRole("progressbar").boundingBox();
      expect(bar!.height).toBeGreaterThanOrEqual(5);
      expect(rect!.height).toBe(6);
      await expect(timer).toHaveText("");
    }
    await page.screenshot({
      path: info.outputPath(`time-bars-${viewport.width}.png`),
    });
  }
  await page.evaluate(async () => {
    const { resetDuel, roomStore } = await import("/src/stores/index.ts");
    resetDuel();
    roomStore.timeLimit = 0;
  });
  await expect(timers.nth(0).getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "不限时",
  );
  await expect(timers.nth(1).getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "不限时",
  );
  await page.evaluate(async () => {
    const { replayStore } = await import("/src/stores/index.ts");
    replayStore.isReplay = true;
  });
  await expect(timers.nth(0).getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "回放不计时",
  );
  await expect(timers.nth(1).getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "回放不计时",
  );
});

async function connectFakeSession(page: Page) {
  await page.evaluate(async () => {
    const { connectSrvpro } = await import("/src/ui/Match/util.ts");
    class FakeSocket {
      static OPEN = 1;
      static CLOSED = 3;
      static CLOSING = 2;
      readyState = 0;
      onopen: Function;
      onclose: Function;
      onmessage: Function;
      onerror: Function;
      constructor() {
        window.__socket = this;
        queueMicrotask(() => {
          this.readyState = 1;
          this.onopen?.(new Event("open"));
          this.onmessage?.(
            new MessageEvent("message", {
              data: new Uint8Array([1, 0, 18]).buffer,
            }),
          );
        });
      }
      send(data: Uint8Array) {
        window.__sent.push([...data]);
      }
      close() {
        if (this.readyState === 3) return;
        this.readyState = 3;
        queueMicrotask(() => this.onclose?.(new Event("close")));
      }
    }
    window.WebSocket = FakeSocket;
    await connectSrvpro({
      ip: "test.invalid:1234",
      player: "Test",
      passWd: "",
    });
    window.__sent = [];
  });
}

test("spectators exit locally without sending a surrender packet", async ({
  page,
}) => {
  await setup(page);
  await connectFakeSession(page);
  await page.evaluate(async () => {
    const { matStore, roomStore } = await import("/src/stores/index.ts");
    matStore.selfType = 3;
    roomStore.selfType = 100;
  });
  await expect(page.getByTestId("duel-leave")).toHaveText("退出观战");
  await expect(page.getByTestId("duel-surrender")).toHaveCount(0);
  await page.getByTestId("duel-leave").click();
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  expect(await page.evaluate(() => window.__socket.readyState)).toBe(3);
  expect(await page.evaluate(() => window.__sent)).toEqual([]);
});

test("server close preserves the result and a downloadable replay after returning to lobby", async ({
  page,
}) => {
  await setup(page);
  await connectFakeSession(page);
  await page.evaluate(async () => {
    // 原始协议的 WIN 帧，断线时仍应保留已接收的录像。
    window.__socket.onmessage(
      new MessageEvent("message", {
        data: new Uint8Array([4, 0, 1, 5, 0, 0]).buffer,
      }),
    );
  });
  await expect(page.getByTestId("duel-end-modal")).toBeVisible();
  await page.evaluate(() => {
    window.__socket.readyState = 3;
    window.__socket.onclose(new Event("close"));
  });
  await expect(page.getByTestId("duel-end-modal")).toBeVisible();
  await expect(page.getByTestId("session-unavailable")).toHaveCount(0);
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "保存录像", exact: true })
    .click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toMatch(/\.neos\.yrp3d$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  expect([...Buffer.concat(chunks)]).toEqual([5, 2, 0, 0, 0, 0, 0]);
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  await expect(page.getByTestId("save-replay")).toHaveText("保存上一局录像");
  const secondDownload = page.waitForEvent("download");
  await page.getByTestId("save-replay").click();
  expect((await secondDownload).suggestedFilename()).toBe(
    download.suggestedFilename(),
  );
});

test("saving at the result waits for server decks and keeps them after disconnect", async ({
  page,
}, info) => {
  await setup(page);
  await connectFakeSession(page);
  await page.evaluate(async () => {
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    settingStore.animation.enabled = false;
    const start = new Uint8Array(21);
    const view = new DataView(start.buffer);
    view.setUint16(0, 19, true);
    start.set([1, 4, 1], 2);
    view.setUint32(5, 8000, true);
    view.setUint32(9, 8000, true);
    [40, 15, 40, 15].forEach((size, index) =>
      view.setUint16(13 + index * 2, size, true),
    );
    const packets = new Uint8Array(27);
    packets.set(start);
    packets.set([4, 0, 1, 5, 0, 0], 21);
    window.__socket.onmessage(
      new MessageEvent("message", { data: packets.buffer }),
    );
  });
  await expect(page.getByTestId("duel-end-modal")).toBeVisible();
  const downloaded = page.waitForEvent("download");
  const save = page.getByRole("dialog").locator("button.ant-btn-primary");
  await save.click();
  await expect(save).toHaveClass(/loading/);
  const decks = [
    {
      name: "Alpha",
      main: Array(40).fill(46986414),
      extra: Array(15).fill(23995346),
    },
    {
      name: "Beta",
      main: Array(40).fill(89631139),
      extra: Array(15).fill(23995346),
    },
  ];
  await page.evaluate(
    (bytes) => {
      const wire = new Uint8Array(bytes.length + 3);
      new DataView(wire.buffer).setUint16(0, bytes.length + 1, true);
      wire[2] = 23;
      wire.set(bytes, 3);
      window.__socket.onmessage(
        new MessageEvent("message", { data: wire.buffer }),
      );
      window.__socket.readyState = 3;
      window.__socket.onclose(new Event("close"));
    },
    [...serverReplayPayload(true, decks)],
  );
  const download = await downloaded;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const bytes = [...Buffer.concat(chunks)];
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  const saved = await page.evaluate(async (bytes) => {
    const { parseYrp3dRecords } = await import("/src/api/ocgcore/replay.ts");
    const { extractReplayDecks } = await import(
      "/src/api/ocgcore/replayDecks.ts"
    );
    const data = Uint8Array.from(bytes).buffer;
    return {
      records: parseYrp3dRecords(data).map((record) => record.func),
      decks: await extractReplayDecks(data),
    };
  }, bytes);
  expect(saved.records).toEqual([4, 5, 231]);
  for (let index = 0; index < 2; index++) {
    expect(saved.decks[index]).toMatchObject({
      game: 1,
      complete: true,
      player: decks[index].name,
      main: decks[index].main,
      extra: decks[index].extra,
    });
  }
  const secondDownload = page.waitForEvent("download");
  await page.getByTestId("save-replay").click();
  const second = await secondDownload;
  await second.saveAs(info.outputPath("server-decks.neos.yrp3d"));
  expect(second.suggestedFilename()).toBe(download.suggestedFilename());
});

test("field cards show live stats, levels and counters with MDPro3 change colors and hide private cards", async ({
  page,
}, info) => {
  await setup(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { genCard } = await import("/src/service/utils/genCard.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const { TYPE_MONSTER, TYPE_XYZ, TYPE_LINK } = await import(
      "/src/common.ts"
    );
    const make = (uuid: string, seq: number, type: number, controller = 0) =>
      genCard({
        uuid,
        code: 46986414,
        meta: {
          id: 46986414,
          data: { type, atk: 2500, def: 2100, level: 7 },
          text: { name: uuid },
        },
        location: new ygopro.CardLocation({
          controller,
          zone: ygopro.CardZone.MZONE,
          sequence: seq,
          position: ygopro.CardPosition.FACEUP_ATTACK,
        }),
        counters: {},
        idleInteractivities: [],
        selectInfo: { selectable: false, selected: false },
        targeted: false,
        isToken: false,
        status: 0,
      });
    cardStore.inner = [
      make("normal", 0, TYPE_MONSTER),
      make("xyz", 2, TYPE_MONSTER | TYPE_XYZ),
      make("link", 4, TYPE_MONSTER | TYPE_LINK),
      make("opponent", 1, TYPE_MONSTER, 1),
      make("hidden", 3, TYPE_MONSTER, 1),
    ];
    cardStore.inner[4].location.position = ygopro.CardPosition.FACEDOWN_DEFENSE;
    const { default: handle } = await import("/src/service/onSocketMessage.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    window.__updateStats = async (
      seq: number,
      flags: number,
      values: number[],
    ) => {
      const payload = new Uint8Array(8 + values.length * 4);
      const dv = new DataView(payload.buffer);
      dv.setUint32(0, payload.length, true);
      dv.setUint32(4, flags, true);
      values.forEach((v, i) => dv.setInt32(8 + i * 4, v, true));
      const wire = new Uint8Array(7 + payload.length);
      new DataView(wire.buffer).setUint16(0, wire.length - 2, true);
      wire.set([1, 7, 0, 4, seq], 2);
      wire.set(payload, 7);
      await handle(
        getUIContainer(),
        new MessageEvent("message", { data: wire.buffer }),
      );
    };
    await window.__updateStats(0, 0x10 | 0x100 | 0x200 | 0x20000, [
      8,
      3000,
      1800,
      1,
      (3 << 16) | 1,
    ]);
    await window.__updateStats(2, 0x20, [4]);
    await window.__updateStats(4, 0x800000, [3, 0]);
  });
  const normal = page.locator('[data-card-uuid="normal"]');
  await expect(normal.getByTestId("field-card-atk")).toHaveText("3000");
  await expect(normal.getByTestId("field-card-atk")).toHaveAttribute(
    "data-change",
    "up",
  );
  await expect(normal.getByTestId("field-card-atk")).toHaveCSS(
    "color",
    "rgb(89, 216, 255)",
  );
  await expect(normal.getByTestId("field-card-def")).toHaveAttribute(
    "data-change",
    "down",
  );
  await expect(normal.getByTestId("field-card-def")).toHaveCSS(
    "color",
    "rgb(255, 121, 121)",
  );
  await expect(normal.getByTestId("field-card-level")).toHaveText("8");
  await expect(normal.getByTestId("field-card-counter")).toHaveText("3");
  await expect(
    page.locator('[data-card-uuid="xyz"]').getByTestId("field-card-level"),
  ).toHaveText("4");
  await expect(
    page.locator('[data-card-uuid="link"]').getByTestId("field-card-level"),
  ).toHaveText("3");
  await expect(
    page.locator('[data-card-uuid="link"]').getByTestId("field-card-def"),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-card-uuid="hidden"]').getByTestId("field-card-info"),
  ).toHaveCount(0);
  await expect(
    normal.getByTestId("field-card-level").locator('svg[data-icon="level"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-card-uuid="xyz"] svg[data-icon="rank"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-card-uuid="link"] svg[data-icon="link"]'),
  ).toBeVisible();
  expect(await normal.getByTestId("field-card-info").innerText()).not.toMatch(
    /ATK|DEF|LINK|阶/,
  );
  await page.waitForTimeout(800);
  await page.screenshot({ path: info.outputPath("field-stats.png") });
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const { callCardMove } = await import(
      "/src/ui/Duel/PlayMat/Card/index.tsx"
    );
    cardStore.inner[0].location.position = ygopro.CardPosition.FACEUP_DEFENSE;
    await callCardMove("normal");
    await window.__updateStats(
      0,
      0x10 | 0x100 | 0x200 | 0x20000,
      [7, 2500, 2100, 0],
    );
  });
  await expect(normal.getByTestId("field-card-atk")).toHaveAttribute(
    "data-change",
    "normal",
  );
  await expect(normal.getByTestId("field-card-counter")).toHaveCount(0);
  await expect(normal.getByTestId("field-card-def")).toHaveAttribute(
    "data-emphasis",
    "true",
  );
  await page.screenshot({ path: info.outputPath("field-stats-defense.png") });
});

test("a buffered clock update followed by WIN still reaches replay and result when the server closes immediately", async ({
  page,
}) => {
  await setup(page);
  await connectFakeSession(page);
  await page.evaluate(() => {
    window.__socket.onmessage(
      new MessageEvent("message", {
        data: new Uint8Array([5, 0, 24, 0, 0, 120, 0, 4, 0, 1, 5, 0, 0]).buffer,
      }),
    );
    window.__socket.readyState = 3;
    window.__socket.onclose(new Event("close"));
  });
  await expect(page.getByTestId("duel-end-modal")).toBeVisible();
  await expect(page.getByTestId("session-unavailable")).toHaveCount(0);
  expect(
    await page.evaluate(async () => {
      const { replayStore } = await import("/src/stores/index.ts");
      return replayStore.encode().map((buffer) => [...new Uint8Array(buffer)]);
    }),
  ).toEqual([[5, 2, 0, 0, 0, 0, 0]]);
});

test("available chain mode asks at non-hint timings and preserves forced effects", async ({
  page,
}) => {
  await setup(page);
  const control = page.getByTestId("duel-chain-setting");
  await control.click();
  await page.getByTestId("duel-chain-setting-available").click();
  await expect(control).toHaveAttribute("data-chain-setting", "available");
  const sendChain = async (
    mode: number,
    count: number,
    forced = false,
    special = 0,
  ) => {
    await page.evaluate(
      async ({ mode, count, forced, special }) => {
        const { matStore } = await import("/src/stores/index.ts");
        const { resetDuelDialogs } = await import("/src/stores/duelDialogs.ts");
        const { getUIContainer } = await import("/src/container/compat.ts");
        const { ygopro } = await import("/src/api/index.ts");
        const { default: selectChain } = await import(
          "/src/service/duel/selectChain.ts"
        );
        resetDuelDialogs();
        window.__sent = [];
        matStore.chainSetting = mode;
        void selectChain(getUIContainer(), {
          special_count: special,
          hint0: 0,
          hint1: 0,
          chains: Array.from({ length: count }, (_, i) => ({
            code: 46986414,
            response: 7 + i,
            forced,
            location: new ygopro.CardLocation({
              controller: 0,
              zone: ygopro.CardZone.MZONE,
              sequence: i,
            }),
          })),
        });
      },
      { mode, count, forced, special },
    );
  };
  const modal = page.locator('[data-testid="duel-select-cards-modal"]:visible');
  const sent = () => page.evaluate(() => window.__sent);
  await sendChain(3, 1);
  await expect(modal).toBeVisible();
  // Waiting past the phase animation duration must never decline an effect.
  await page.waitForTimeout(800);
  expect(await sent()).toEqual([]);
  await page.locator('[data-testid="duel-select-card-option"]:visible').click();
  await page.locator('[data-testid="duel-select-card-submit"]:visible').click();
  expect((await sent()).at(-1).slice(2)).toEqual([1, 7, 0, 0, 0]);
  for (const mode of [1, 2, 3]) {
    await sendChain(mode, 0);
    await expect.poll(sent).toEqual([[5, 0, 1, 255, 255, 255, 255]]);
  }
  for (const special of [0, 1]) {
    await sendChain(0, 0, false, special);
    await expect(page.getByTestId("duel-yesno-yes")).toBeVisible();
    await expect(
      page.getByText("没有卡片可以连锁。", { exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("duel-yesno-no")).toHaveCount(0);
    expect(await sent()).toEqual([]);
    await page.getByTestId("duel-yesno-yes").click();
    await expect.poll(sent).toEqual([[5, 0, 1, 255, 255, 255, 255]]);
    await expect(page.getByTestId("duel-yesno-yes")).not.toBeVisible();
  }
  for (const mode of [1, 2]) {
    await sendChain(mode, 1);
    await expect.poll(sent).toEqual([[5, 0, 1, 255, 255, 255, 255]]);
  }
  for (const [mode, special] of [
    [0, 0],
    [2, 1],
    [3, 0],
  ]) {
    await sendChain(mode, 2, false, special);
    await expect(modal).toBeVisible();
    expect(await sent()).toEqual([]);
    await page
      .locator('[data-testid="duel-select-card-cancel"]:visible')
      .click();
    await expect.poll(sent).toEqual([[5, 0, 1, 255, 255, 255, 255]]);
  }
  for (const mode of [1, 3]) {
    for (const count of [1, 2]) {
      await sendChain(mode, count, true);
      await expect(modal).toBeVisible();
      await expect(
        page.locator('[data-testid="duel-select-card-cancel"]:visible'),
      ).not.toBeVisible();
      expect(await sent()).toEqual([]);
      await modal.getByTestId("duel-select-card-option").first().click();
      await page.getByTestId("duel-select-card-submit").click();
      await expect.poll(sent).toEqual([[5, 0, 1, 7, 0, 0, 0]]);
    }
  }
});

test("empty ALL chain confirmation allows clock updates and settles when the duel resets", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { matStore } = await import("/src/stores/index.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: handle } = await import("/src/service/onSocketMessage.ts");
    matStore.chainSetting = 0;
    window.__chainDone = false;
    // 空连锁询问后立即到达对方计时消息，弹窗不能阻塞后续网络消息。
    void handle(
      getUIContainer(),
      new MessageEvent("message", {
        data: new Uint8Array([
          13, 0, 1, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 24, 1, 0, 90, 0,
        ]).buffer,
      }),
    ).then(() => {
      window.__chainDone = true;
    });
  });
  await expect(page.getByTestId("duel-yesno-yes")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__chainDone)).toBe(true);
  expect(
    await page.evaluate(async () => {
      const { matStore } = await import("/src/stores/index.ts");
      return [matStore.timeLimits.activePlayer, matStore.timeLimits.op];
    }),
  ).toEqual([1, 90]);
  await page.evaluate(async () => {
    const { resetDuelDialogs } = await import("/src/stores/duelDialogs.ts");
    resetDuelDialogs(true);
  });
  await expect(page.getByTestId("duel-yesno-yes")).not.toBeVisible();
  expect(await page.evaluate(() => window.__sent)).toEqual([]);
});

test("phase banners show DP and SP in order, send no response and clear on disconnect", async ({
  page,
}, info) => {
  await setup(page);
  await page.evaluate(async () => {
    const { default: handle } = await import("/src/service/duel/gameMsg.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const phases = ygopro.StocGameMessage.MsgNewPhase.PhaseType;
    window.__phaseDone = false;
    window.__phases = [];
    window.__showPhase = (name: string) =>
      handle(getUIContainer(), {
        stoc_game_msg: {
          gameMsg: "new_phase",
          new_phase: { phase_type: phases[name] },
        },
      });
    void (async () => {
      for (const phase of ["DRAW", "STANDBY", "MAIN1"]) {
        await window.__showPhase(phase);
        window.__phases.push(phase);
      }
      window.__phaseDone = true;
    })();
  });
  const banner = page.getByTestId("duel-phase-banner");
  await expect(banner).toHaveAttribute("data-phase", "DP");
  await expect(banner).toHaveCSS("pointer-events", "none");
  await page.screenshot({ path: info.outputPath("draw-phase.png") });
  await expect(banner).toHaveAttribute("data-phase", "SP");
  await expect(banner).toHaveAttribute("data-phase", "M1");
  await expect.poll(() => page.evaluate(() => window.__phaseDone)).toBe(true);
  await expect(banner).not.toBeVisible();
  expect(await page.evaluate(() => window.__phases)).toEqual([
    "DRAW",
    "STANDBY",
    "MAIN1",
  ]);
  expect(await page.evaluate(() => window.__sent)).toEqual([]);
  // A reset cancels both the display and its pending wait immediately.
  await page.evaluate(async () => {
    window.__phaseDone = false;
    void window.__showPhase("END").then(() => {
      window.__phaseDone = true;
    });
  });
  await expect(banner).toHaveAttribute("data-phase", "EP");
  await page.evaluate(async () => {
    const { resetDuelDialogs } = await import("/src/stores/duelDialogs.ts");
    resetDuelDialogs(true);
  });
  await expect(banner).not.toBeVisible();
  expect(await page.evaluate(() => window.__phaseDone)).toBe(true);
  await page.evaluate(() => window.__showPhase("DAMAGE"));
  await expect(banner).not.toBeVisible();
});

test("xyz material badges track attached cards, detachments and controller changes", async ({
  page,
}, info) => {
  await setup(page);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const { TYPE_MONSTER, TYPE_XYZ } = await import("/src/common.ts");
    const make = (
      uuid: string,
      controller: number,
      overlay = false,
      sequence = 2,
    ) => ({
      uuid,
      code: 46986414,
      meta: {
        id: 46986414,
        data: { type: TYPE_MONSTER | TYPE_XYZ, rank: 4, atk: 2500, def: 2100 },
        text: { name: uuid },
      },
      location: new ygopro.CardLocation({
        controller,
        zone: ygopro.CardZone.MZONE,
        sequence,
        position: ygopro.CardPosition.FACEUP_ATTACK,
        is_overlay: overlay,
        overlay_sequence: Number(uuid.at(-1)) || 0,
      }),
      counters: {},
      idleInteractivities: [],
      selectInfo: { selectable: false, selected: false },
      targeted: false,
      isToken: false,
      status: 0,
    });
    cardStore.inner = [
      make("xyz", 0),
      make("opponent-xyz", 1),
      make("material0", 0, true),
      make("material1", 0, true),
      make("other-material", 1, true),
      make("different-zone", 0, true, 4),
    ];
  });
  const host = page.locator('[data-card-uuid="xyz"]');
  const opponent = page.locator('[data-card-uuid="opponent-xyz"]');
  await expect(host.getByTestId("field-card-materials")).toHaveText("2");
  await expect(opponent.getByTestId("field-card-materials")).toHaveText("1");
  await expect(
    page.locator('[data-card-uuid="material0"]').getByTestId("field-card-info"),
  ).toHaveCount(0);
  await page.waitForTimeout(800);
  await page.screenshot({ path: info.outputPath("xyz-materials.png") });
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const { default: move } = await import("/src/service/duel/move.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const material = cardStore.inner.find((c) => c.uuid === "material0");
    await move(getUIContainer(), {
      code: material.code,
      from: material.location,
      to: new ygopro.CardLocation({
        controller: 0,
        zone: ygopro.CardZone.GRAVE,
        sequence: 0,
        position: ygopro.CardPosition.FACEUP_ATTACK,
      }),
      reason: 0,
    });
  });
  await expect(host.getByTestId("field-card-materials")).toHaveText("1");
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    cardStore.inner.find((c) => c.uuid === "material1").location.controller = 1;
  });
  await expect(host.getByTestId("field-card-materials")).toHaveText("0");
  await expect(opponent.getByTestId("field-card-materials")).toHaveText("2");
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    cardStore.inner.find((c) => c.uuid === "xyz").location.position =
      ygopro.CardPosition.FACEDOWN_DEFENSE;
  });
  await expect(host.getByTestId("field-card-materials")).toHaveCount(0);
});

test("spectator life bars show both seats and keep player names in participant view", async ({
  page,
}) => {
  await setup(page);
  const bottom = page.locator(
    '[data-testid="duel-player-life"][data-player="me"]',
  );
  const top = page.locator(
    '[data-testid="duel-player-life"][data-player="op"]',
  );
  await page.evaluate(async () => {
    const { roomStore, matStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: typeChange } = await import(
      "/src/service/room/typeChange.ts"
    );
    roomStore.players = [
      { name: "First seat", state: 0, isMe: true },
      { name: "Second seat", state: 0, isMe: false },
    ];
    typeChange(
      getUIContainer(),
      new ygopro.YgoStocMsg({
        stoc_type_change: new ygopro.StocTypeChange({
          self_type: ygopro.StocTypeChange.SelfType.OBSERVER,
        }),
      }),
    );
    matStore.selfType = ygopro.StocGameMessage.MsgStart.PlayerType.Observer;
  });
  await expect(bottom.getByText("First seat", { exact: true })).toBeVisible();
  await expect(top.getByText("Second seat", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(async () => {
      const { roomStore } = await import("/src/stores/index.ts");
      return roomStore.players.some((player) => player?.isMe);
    }),
  ).toBe(false);

  // 名称晚于观战身份到达时，也应更新对应席位。
  await page.evaluate(async () => {
    const { ygopro } = await import("/src/api/index.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: enter } = await import(
      "/src/service/room/hsPlayerEnter.ts"
    );
    enter(
      getUIContainer(),
      new ygopro.YgoStocMsg({
        stoc_hs_player_enter: new ygopro.StocHsPlayerEnter({
          pos: 0,
          name: "Updated first seat",
        }),
      }),
    );
  });
  await expect(
    bottom.getByText("Updated first seat", { exact: true }),
  ).toBeVisible();
  await expect(top.getByText("Second seat", { exact: true })).toBeVisible();

  // 名称消息也必须分别更新两位玩家，避免覆盖同一个席位。
  await page.evaluate(async () => {
    const { ygopro } = await import("/src/api/index.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: names } = await import("/src/service/duel/sibylName.ts");
    names(
      getUIContainer(),
      new ygopro.StocGameMessage.MsgSibylName({
        name_0: "Replay first",
        name_1: "Replay second",
      }),
    );
  });
  await expect(bottom.getByText("Replay first", { exact: true })).toBeVisible();
  await expect(top.getByText("Replay second", { exact: true })).toBeVisible();

  // 第二个席位的参战玩家仍显示在下方。
  await page.evaluate(async () => {
    const { ygopro } = await import("/src/api/index.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: typeChange } = await import(
      "/src/service/room/typeChange.ts"
    );
    typeChange(
      getUIContainer(),
      new ygopro.YgoStocMsg({
        stoc_type_change: new ygopro.StocTypeChange({
          self_type: ygopro.StocTypeChange.SelfType.PLAYER2,
        }),
      }),
    );
  });
  await expect(
    bottom.getByText("Replay second", { exact: true }),
  ).toBeVisible();
  await expect(top.getByText("Replay first", { exact: true })).toBeVisible();
});

test("translucent selection can move within the viewport and still submit after minimizing", async ({
  page,
}, info) => {
  await setup(page);
  await openSelection(page);
  const surface = page.locator(
    '[data-testid="duel-movable-selection"]:visible',
  );
  const handle = page.locator(
    '[data-testid="duel-selection-drag-handle"]:visible',
  );
  await expect(handle).toBeVisible();
  await expect(
    handle.locator('xpath=ancestor::*[@role="dialog"]'),
  ).not.toHaveClass(/zoom/);
  await handle.click({ trial: true });
  const initial = (await surface.boundingBox())!;
  const alpha = await surface
    .locator(".ant-modal-content")
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(alpha).toBe("rgba(30, 35, 48, 0.72)");
  const grip = (await handle.boundingBox())!;
  await page.mouse.move(grip.x + 20, grip.y + 10);
  await page.mouse.down();
  await page.mouse.move(grip.x + 160, grip.y + 90, { steps: 10 });
  await page.mouse.up();
  await expect
    .poll(async () => (await surface.boundingBox())!.x - initial.x)
    .toBeGreaterThan(100);
  await expect
    .poll(async () => (await surface.boundingBox())!.y - initial.y)
    .toBeGreaterThan(50);
  expect(await page.evaluate(() => window.__selected)).toBeNull();
  await page.screenshot({ path: info.outputPath("movable-selection.png") });
  // 拖到窗口边缘仍能找回标题。
  await handle.focus();
  for (let i = 0; i < 60; i++) await handle.press("ArrowRight");
  const bounded = (await surface.boundingBox())!;
  expect(bounded.x + bounded.width).toBeLessThanOrEqual(
    page.viewportSize()!.width - 7,
  );
  await handle.dblclick();
  await expect
    .poll(async () => Math.abs((await surface.boundingBox())!.x - initial.x))
    .toBeLessThan(1);
  await surface.locator(".ant-modal-close").click();
  await surface.locator(".ant-modal-close").click();
  await page.getByTestId("duel-select-card-option").nth(1).click();
  await page.locator('[data-testid="duel-select-card-submit"]:visible').click();
  await expect.poll(() => page.evaluate(() => window.__selected)).toEqual([1]);
  await openSelection(page);
  await expect
    .poll(async () => Math.abs((await surface.boundingBox())!.x - initial.x))
    .toBeLessThan(1);
  await page.setViewportSize({ width: 844, height: 390 });
  await handle.focus();
  await handle.press("ArrowDown");
  const small = (await handle.boundingBox())!;
  expect(small.y).toBeGreaterThanOrEqual(0);
  expect(small.y + small.height).toBeLessThanOrEqual(390);
});

test("effect confirmation is translucent and movable with quoted card names", async ({
  page,
}, info) => {
  await setup(page);
  for (const description of [0, 221, 222]) {
    await page.evaluate(async (description) => {
      const { default: selectEffectYn } = await import(
        "/src/service/duel/selectEffectYn.ts"
      );
      const { ygopro } = await import("/src/api/index.ts");
      const { matStore } = await import("/src/stores/index.ts");
      localStorage.setItem("!system_1004", "怪兽区");
      localStorage.setItem("!system_200", "是否在[%ls]发动[%ls]的诱发类效果?");
      localStorage.setItem("!system_221", "是否在[%ls]发动[%ls]的效果?");
      localStorage.setItem("!system_222", "是否发动[%ls]的效果?");
      matStore.hint.esHint = "怪兽特殊召唤成功";
      void selectEffectYn(
        new ygopro.StocGameMessage.MsgSelectEffectYn({
          code: 1000001,
          effect_description: description,
          location: new ygopro.CardLocation({
            controller: 0,
            zone: 4,
            sequence: 0,
          }),
        }),
      );
    }, description);
    const surface = page.locator(
      '[data-testid="duel-movable-selection"]:visible',
    );
    const handle = page.locator(
      '[data-testid="duel-selection-drag-handle"]:visible',
    );
    await expect(handle).toContainText("『圣月之魔导士 恩底弥翁』");
    if (description !== 222) {
      await expect(handle).toContainText("在怪兽区");
      await expect(handle).not.toContainText("『怪兽区』");
    }
    await expect(surface.locator(".ant-modal-content")).toHaveCSS(
      "background-color",
      "rgba(30, 35, 48, 0.72)",
    );
    await expect(
      handle.locator('xpath=ancestor::*[@role="dialog"]'),
    ).not.toHaveClass(/zoom/);
    await handle.focus();
    const before = (await surface.boundingBox())!;
    await handle.press("ArrowRight");
    await expect
      .poll(async () => (await surface.boundingBox())!.x - before.x)
      .toBeGreaterThan(10);
    if (description === 0)
      await page.screenshot({
        path: info.outputPath("effect-confirmation.png"),
      });
    const titleBeforeClose = await handle.textContent();
    await handle.evaluate((node) => {
      window.__effectClosingTitles = [node.textContent];
      window.__effectCloseObserver = new MutationObserver(() => {
        // 记录退出动画期间的标题，捕获普通可见性断言容易漏掉的闪烁。
        if (node.getClientRects().length)
          window.__effectClosingTitles.push(node.textContent);
      });
      window.__effectCloseObserver.observe(node, {
        subtree: true,
        childList: true,
        characterData: true,
      });
    });
    const button = description === 221 ? "duel-yesno-no" : "duel-yesno-yes";
    await page.getByTestId(button).click();
    await expect(page.getByTestId("duel-yesno-modal")).not.toBeVisible();
    const closingTitles = await page.evaluate(() => {
      window.__effectCloseObserver.disconnect();
      return window.__effectClosingTitles;
    });
    expect(closingTitles).toEqual(closingTitles.map(() => titleBeforeClose));
    const sent = await page.evaluate(() => window.__sent.at(-1));
    expect(sent.slice(-4)).toEqual([description === 221 ? 0 : 1, 0, 0, 0]);
  }
});

test("all remaining effect dialogs are translucent, movable and keep their responses", async ({
  page,
}, info) => {
  await setup(page);
  for (const kind of ["option", "announce", "counter", "sort", "position"]) {
    await page.evaluate(async (kind) => {
      const dialogs = await import("/src/ui/Duel/Message/index.ts");
      const { fetchCard, ygopro } = await import("/src/api/index.ts");
      const { resetDuelDialogs } = await import("/src/stores/duelDialogs.ts");
      resetDuelDialogs();
      window.__sent = [];
      switch (kind) {
        case "option":
          void dialogs.displayOptionModal(
            "请选择要发动的效果",
            [
              { info: "抽一张卡", response: 0 },
              { info: "恢复生命值", response: 1 },
            ],
            1,
          );
          break;
        case "announce":
          void dialogs.displayAnnounceModal([1]);
          break;
        case "counter":
          void dialogs.displayCheckCounterModal({
            min: 1,
            counterType: 1,
            options: [{ code: 1000001, max: 1 }],
          });
          break;
        case "sort":
          void dialogs.displaySortCardModal([
            { meta: fetchCard(1000001), response: 0 },
            { meta: fetchCard(89631139), response: 1 },
          ]);
          break;
        case "position":
          void dialogs.displayPositionModal(
            [
              ygopro.CardPosition.FACEUP_ATTACK,
              ygopro.CardPosition.FACEUP_DEFENSE,
            ],
            1000001,
          );
          break;
      }
    }, kind);
    const surface = page.locator(
      '[data-testid="duel-movable-selection"]:visible',
    );
    const handle = page.locator(
      '[data-testid="duel-selection-drag-handle"]:visible',
    );
    await expect(handle).toBeVisible();
    await expect(
      handle.locator('xpath=ancestor::*[@role="dialog"]'),
    ).not.toHaveClass(/zoom/);
    await expect(surface.locator(".ant-modal-content")).toHaveCSS(
      "background-color",
      "rgba(30, 35, 48, 0.72)",
    );
    const before = (await surface.boundingBox())!;
    await handle.focus();
    await handle.press("ArrowRight");
    await expect
      .poll(async () => (await surface.boundingBox())!.x - before.x)
      .toBeGreaterThan(10);
    switch (kind) {
      case "option":
        await page.getByTestId("duel-option-item").nth(1).click();
        await page.screenshot({ path: info.outputPath("effect-options.png") });
        await page.getByTestId("duel-option-submit").click();
        break;
      case "announce":
        await page.getByTestId("duel-announce-search").fill("圣月");
        await page.getByTestId("duel-announce-search-submit").click();
        await expect(
          surface.getByText("『圣月之魔导士 恩底弥翁』").first(),
        ).toBeVisible();
        await surface
          .getByTestId("duel-announce-card-option")
          .first()
          .getByRole("checkbox")
          .check();
        await page.getByTestId("duel-announce-submit").click();
        break;
      case "counter":
        await surface.getByRole("spinbutton").fill("1");
        await surface
          .getByRole("button", { name: "finish", exact: true })
          .click();
        break;
      case "sort":
        const sortCards = surface.getByTestId("duel-sort-card-option");
        await sortCards.last().focus();
        await sortCards.last().press("Space");
        await sortCards.first().click();
        await surface.getByTestId("duel-sort-card-submit").click();
        break;
      case "position":
        await page.getByTestId("duel-position-option").last().click();
        break;
    }
    await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
    if (kind === "option")
      expect(await page.evaluate(() => window.__sent[0].slice(-4))).toEqual([
        1, 0, 0, 0,
      ]);
    if (kind === "sort")
      expect(await page.evaluate(() => window.__sent[0].slice(3))).toEqual([
        1, 0,
      ]);
    await expect(surface).toHaveCount(0);
  }
});

test("card-name formatting covers effect descriptions and hints without nesting quotes", async ({
  page,
}) => {
  await setup(page);
  const result = await page.evaluate(async () => {
    const { formatCardName } = await import("/src/api/cardText.ts");
    const { getCardStr } = await import("/src/api/cards.ts");
    const { fetchEsHintMeta } = await import("/src/service/duel/util.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { fetchSelectHintMeta, matStore } = await import(
      "/src/stores/index.ts"
    );
    const name = "圣月之魔导士 恩底弥翁";
    const meta = {
      id: 1000001,
      data: {},
      text: {
        name,
        str1: `是否发动${name}的效果？`,
        str2: `选择『${name}』作为对象`,
      },
    };
    await fetchEsHintMeta({
      context: getUIContainer().context,
      originMsg: "[?]的效果处理",
      cardID: 1000001,
    });
    const preHint = matStore.hint.esHint;
    localStorage.setItem("!system_569", "请选择[%ls]的放置位置");
    fetchSelectHintMeta({ selectHintData: 1000001 });
    return {
      effect: getCardStr(meta, 0),
      alreadyQuoted: getCardStr(meta, 1),
      preHint,
      placeHint: matStore.hint.msg,
      existing: formatCardName(`「${name}」与『${name}』`, name),
      literal: formatCardName("A+B$&的效果", "A+B$&"),
      generic: formatCardName("抽一张卡", name),
      placeholder: formatCardName("『[%ls]』的效果", "青眼白龙", "[%ls]"),
      multiple: formatCardName("[?]选择[?]", "青眼白龙", "[?]"),
    };
  });
  expect(result).toEqual({
    effect: "是否发动『圣月之魔导士 恩底弥翁』的效果？",
    alreadyQuoted: "选择『圣月之魔导士 恩底弥翁』作为对象",
    preHint: "『圣月之魔导士 恩底弥翁』的效果处理",
    placeHint: "请选择『圣月之魔导士 恩底弥翁』的放置位置",
    existing: "『圣月之魔导士 恩底弥翁』与『圣月之魔导士 恩底弥翁』",
    literal: "『A+B$&』的效果",
    generic: "抽一张卡",
    placeholder: "『青眼白龙』的效果",
    multiple: "『青眼白龙』选择[?]",
  });
});
