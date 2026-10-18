import { readFile } from "node:fs/promises";

import { expect, type Locator, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

import { trackCardRenders } from "./helpers/card-renders";

let database: Buffer;
test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
  );
  for (let i = 1; i <= 5; i++) {
    db.run("INSERT INTO datas VALUES (?, ?)", [
      1000000 + i,
      i === 5 ? 0x4001 : 1,
    ]);
    db.run("INSERT INTO texts VALUES (?, ?, ?)", [
      1000000 + i,
      `连锁卡片 ${i}`,
      `效果说明 ${i}`,
    ]);
  }
  database = Buffer.from(db.export());
  db.close();
});

async function setup(page: Page, animations = false) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route("**/ygopro-super-pre/data/version.txt", (route) =>
    route.fulfill({ body: "1792173550" }),
  );
  await page.route(/\.cdb(?:\?.*)?$/, (route) =>
    route.fulfill({ body: database }),
  );
  await page.route("**/*.conf", (route) =>
    route.fulfill({
      body: "!system 23 即将结束主要阶段\n!system 25 战斗阶段结束时\n!system 29 即将结束战斗步骤\n!system 203 是否要进行连锁？\n!system 1001 手牌\n!system 1004 墓地",
    }),
  );
  await page.route(/\/test-release-v2\.json(?:\?.*)?$/, (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route(/\/100000[1-5]\.(webp|jpg)(\?.*)?$/, (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 146"><rect width="100" height="146" fill="#a48152"/><text x="8" y="75" fill="white">CHAIN</text></svg>',
    }),
  );
  await page.goto("/match");
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  await page.evaluate(async (animations) => {
    const { initializeApp } = await import("/src/ui/Layout/utils.ts");
    await initializeApp();
    const { initUIContainer, getUIContainer } = await import(
      "/src/container/compat.ts"
    );
    const { matStore, cardStore } = await import("/src/stores/index.ts");
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    const { fetchCard, ygopro } = await import("/src/api/index.ts");
    const { genCard } = await import("/src/service/utils/genCard.ts");
    const { default: handle } = await import("/src/service/onSocketMessage.ts");
    settingStore.saveAnimationConfig({ enabled: animations });
    window.__sent = [];
    initUIContainer({
      isClosed: () => false,
      close: () => {},
      ws: {
        readyState: WebSocket.OPEN,
        send: (data) => window.__sent.push([...data]),
      },
    });
    matStore.reset();
    matStore.selfType = ygopro.StocTypeChange.SelfType.PLAYER1;
    cardStore.inner = [
      ["hand", ygopro.CardZone.HAND, 0],
      ["grave", ygopro.CardZone.GRAVE, 1000002],
      ["removed", ygopro.CardZone.REMOVED, 1000003],
    ].map(([uuid, zone, code]) =>
      genCard({
        uuid,
        code,
        meta: fetchCard(code),
        location: new ygopro.CardLocation({
          controller: 1,
          zone,
          sequence: 0,
          position: code
            ? ygopro.CardPosition.FACEUP_ATTACK
            : ygopro.CardPosition.FACEDOWN_ATTACK,
        }),
        counters: {},
        idleInteractivities: [],
        selectInfo: { selectable: false, selected: false },
        status: 0,
        isToken: false,
        targeted: false,
      }),
    );
    window.__chainSend = async (payload: number[]) => {
      const wire = new Uint8Array(payload.length + 3);
      new DataView(wire.buffer).setUint16(0, payload.length + 1, true);
      wire[2] = 1;
      wire.set(payload, 3);
      await handle(
        getUIContainer(),
        new MessageEvent("message", { data: wire.buffer }),
      );
    };
    history.pushState({}, "", "/duel");
    dispatchEvent(new PopStateEvent("popstate"));
  }, animations);
  await expect(page.getByTestId("duel-toolbar")).toBeVisible();
  await expect(page.getByTestId("duel-card")).toHaveCount(3);
}

const u32 = (value: number) => {
  const bytes = Buffer.alloc(4);
  bytes.writeUInt32LE(value);
  return [...bytes];
};
const send = (page: Page, payload: number[]) =>
  page.evaluate((payload) => window.__chainSend(payload), payload);
const activate = (page: Page, code: number, zone: number) =>
  send(page, [70, ...u32(code), 1, zone, 0, 0, 1, zone, 0, ...u32(0), 1]);
const source = (page: Page, uuid: string) =>
  page.locator(`[data-testid="duel-card"][data-card-uuid="${uuid}"]`);

for (const forced of [false, true]) {
  test(`phase-change response window retains timing hints for ${
    forced ? "forced" : "optional"
  } effects`, async ({ page }, info) => {
    await setup(page);
    await page.evaluate(async () => {
      const { matStore, ChainSetting } = await import("/src/stores/index.ts");
      matStore.currentPlayer = 1;
      matStore.chainSetting = ChainSetting.CHAIN_AVAILABLE;
    });
    for (const [code, text] of [
      [23, "即将结束主要阶段"],
      [25, "战斗阶段结束时"],
      [29, "即将结束战斗步骤"],
    ] as const) {
      await send(page, [2, 1, 0, ...u32(code)]);
      expect(
        await page.evaluate(async () => {
          const { matStore } = await import("/src/stores/index.ts");
          return matStore.hint.esHint;
        }),
      ).toBe(text);
      await send(page, [
        16,
        0,
        2,
        1,
        ...u32(0),
        ...u32(0),
        ...[0, 1].flatMap((index) => [
          0,
          Number(forced),
          ...u32(1000002 + index),
          1,
          index === 0 ? 16 : 32,
          0,
          0,
          ...u32(0),
        ]),
      ]);
      const modal = page.getByTestId("duel-select-cards-modal");
      await expect(modal).toBeVisible();
      await expect(page.locator(".ant-modal-title:visible")).toContainText(
        text,
        { timeout: 2000 },
      );
      if (code === 23)
        await page.screenshot({ path: info.outputPath("phase-response.png") });
      if (forced) {
        await modal.getByTestId("duel-select-card-option").first().click();
        await page.getByTestId("duel-select-card-submit").click();
      } else await page.getByTestId("duel-select-card-cancel").click();
      await expect(modal).toHaveCount(0);
    }
  });
}

test("card and chain updates do not render unrelated cards", async ({
  page,
}) => {
  await trackCardRenders(page);
  await setup(page);
  await page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    window.__cardRenders = {};
    const { matStore } = await import("/src/stores/index.ts");
    matStore.chainCards.push({
      cardUuid: "grave",
      code: 1000002,
      controller: 1,
      solved: false,
    });
  });
  await expect(page.getByTestId("duel-chain-marker")).toHaveCount(1);
  expect(await page.evaluate(() => window.__cardRenders)).toEqual({});

  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    cardStore.inner.find((card) => card.uuid === "grave")!.status = 1;
  });
  await expect(source(page, "grave")).toHaveAttribute("data-card-status", "1");
  const renders = await page.evaluate(() => window.__cardRenders);
  expect(renders.grave).toBeGreaterThan(0);
  expect(renders.hand ?? 0).toBe(0);
  expect(renders.removed ?? 0).toBe(0);
});

test("replay keeps card render work bounded through message 200", async ({
  page,
}, info) => {
  await trackCardRenders(page);
  await setup(page, true);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.route(/\.(webp|jpg)(\?.*)?$/, (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 146"><rect width="100" height="146" fill="#a48152"/></svg>',
    }),
  );
  const replay = [
    ...(await readFile("tests/e2e/fixtures/replays/1/replay.yrp3d")),
  ];
  const metrics = await page.evaluate(async (bytes) => {
    const { parseYrp3dRecords } = await import("/src/api/ocgcore/replay.ts");
    const { cardStore, replayStore } = await import("/src/stores/index.ts");
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    settingStore.saveAnimationConfig({ enabled: true, speed: 0.7 });
    cardStore.inner = [];
    replayStore.beginReplay();
    replayStore.isReplay = true;
    replayStore.setSpeed(1);
    const records = parseYrp3dRecords(new Uint8Array(bytes).buffer)
      .filter((record) => record.func !== 231)
      .slice(0, 201);
    const gaps: number[] = [];
    const longTasks: number[] = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) longTasks.push(entry.duration);
    });
    observer.observe({ type: "longtask" });
    let previous: number | undefined;
    let frame: number;
    const sample = (time: number) => {
      if (previous !== undefined) gaps.push(time - previous);
      previous = time;
      frame = requestAnimationFrame(sample);
    };
    frame = requestAnimationFrame(sample);
    window.__cardRenders = {};
    const started = performance.now();
    for (const record of records) {
      await window.__chainSend([record.func, ...new Uint8Array(record.data)]);
    }
    await new Promise(requestAnimationFrame);
    cancelAnimationFrame(frame);
    observer.disconnect();
    const ordered = gaps.slice().sort((a, b) => a - b);
    return {
      messages: records.length,
      renders: Object.values(window.__cardRenders).reduce(
        (sum, count) => sum + count,
        0,
      ),
      longTasks: longTasks.length,
      longTaskMs: longTasks.reduce((sum, duration) => sum + duration, 0),
      gapsOver50ms: gaps.filter((gap) => gap > 50).length,
      gapP99: ordered[Math.floor(ordered.length * 0.99)],
      elapsedMs: performance.now() - started,
      cards: cardStore.inner.length,
      cardContents: document.querySelectorAll(
        '[data-testid="duel-card"] [class*="img-wrap"]',
      ).length,
      stackSurfaces: document.querySelectorAll(
        '[data-testid="duel-stack-surface"]',
      ).length,
      domElements: document.querySelectorAll("*").length,
      userAgent: navigator.userAgent,
    };
  }, replay);
  console.log("Replay render metrics:", JSON.stringify(metrics));
  await info.attach("card-render-metrics", {
    body: JSON.stringify(metrics, null, 2),
    contentType: "application/json",
  });
  expect(metrics.messages).toBe(201);
  if (process.env.PLAYWRIGHT_CARD_PROFILE_BASELINE !== "1")
    expect(metrics.renders).toBeLessThan(5000);
});

test("covered stacks and reserved tokens keep protocol state without full card contents", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const { genCard } = await import("/src/service/utils/genCard.ts");
    cardStore.inner = [0, 1].flatMap((controller) =>
      [
        [ygopro.CardZone.DECK, 40],
        [ygopro.CardZone.EXTRA, 15],
        [ygopro.CardZone.TZONE, 13],
      ].flatMap(([zone, length]) =>
        Array.from({ length }, (_, sequence) =>
          genCard({
            uuid: `${controller}-${ygopro.CardZone[zone]}-${sequence}`,
            code: 0,
            meta: { id: 0, data: {}, text: {} },
            location: new ygopro.CardLocation({
              controller,
              zone,
              sequence,
              position: ygopro.CardPosition.FACEDOWN_ATTACK,
            }),
            isToken: zone === ygopro.CardZone.TZONE,
            status: 0,
            counters: {},
            idleInteractivities: [],
            targeted: false,
            selectInfo: { selectable: false, selected: false },
          }),
        ),
      ),
    );
  });
  await expect(page.getByTestId("duel-card")).toHaveCount(136);
  await expect(
    page.locator('[data-testid="duel-card"] [class*="img-wrap"]'),
  ).toHaveCount(12);
  await expect(
    page.locator('[data-card-zone="TZONE"] [class*="img-wrap"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-testid="duel-zone-count"][data-zone="DECK"]').first(),
  ).toHaveText("40");
  await send(page, [50, ...u32(1000001), 0, 1, 0, 2, 0, 2, 0, 2, ...u32(0)]);
  const drawn = source(page, "0-DECK-0");
  await expect(drawn).toHaveAttribute("data-card-zone", "HAND");
  await expect(drawn.locator('[class*="img-wrap"]')).toHaveCount(1);
  // 预留衍生物仍由正常移卡协议进入场地，离场后再次隐藏完整内容。
  await send(page, [50, ...u32(1000005), 0, 1, 0, 2, 0, 4, 2, 1, ...u32(0)]);
  const token = source(page, "0-TZONE-0");
  await expect(token).toHaveAttribute("data-card-zone", "MZONE");
  await expect(token).toHaveAttribute("data-card-is-token", "true");
  await expect(token.locator('[class*="img-wrap"]')).toHaveCount(1);
  await send(page, [50, ...u32(1000005), 0, 4, 2, 1, 0, 1, 0, 2, ...u32(0)]);
  await expect(token).toHaveAttribute("data-card-zone", "TZONE");
  await expect(token.locator('[class*="img-wrap"]')).toHaveCount(0);
  expect(
    await page.evaluate(async () => {
      const { cardStore } = await import("/src/stores/index.ts");
      return cardStore.inner.length;
    }),
  ).toBe(136);
});

for (const customSleeves of [false, true]) {
  test(`covered stacks retain their full thickness with ${
    customSleeves ? "custom" : "default"
  } sleeves`, async ({ page }, info) => {
    await page.route(/\/(?:card_back|sleeves\/[^/]+)\.webp(\?.*)?$/, (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 146"><rect width="100" height="146" fill="#cf9d58"/><rect x="3" y="3" width="94" height="140" fill="#673b22"/></svg>',
      }),
    );
    await setup(page);
    const sleeves = await page.evaluate(async (custom) => {
      const { cardStore } = await import("/src/stores/index.ts");
      const { fetchCard, ygopro } = await import("/src/api/index.ts");
      const { genCard } = await import("/src/service/utils/genCard.ts");
      const { appearanceStore, sleeveCatalog, sleeveUrl } = await import(
        "/src/stores/appearanceStore.ts"
      );
      const slots = ["meMain", "meExtra", "opMain", "opExtra"] as const;
      slots.forEach((slot, index) => {
        appearanceStore[slot] = sleeveCatalog[custom ? index + 1 : 0].id;
      });
      cardStore.inner = [0, 1].flatMap((controller) =>
        [
          [ygopro.CardZone.DECK, 35],
          [ygopro.CardZone.EXTRA, 15],
        ].flatMap(([zone, length]) =>
          Array.from({ length }, (_, sequence) =>
            genCard({
              uuid: `${controller}-${ygopro.CardZone[zone]}-${sequence}`,
              code:
                zone === ygopro.CardZone.DECK && sequence === 0 ? 1000001 : 0,
              meta: fetchCard(0),
              sleeveType: zone === ygopro.CardZone.EXTRA ? "extra" : "main",
              location: new ygopro.CardLocation({
                controller,
                zone,
                sequence,
                position: ygopro.CardPosition.FACEDOWN_ATTACK,
              }),
              isToken: false,
              status: 0,
              counters: {},
              idleInteractivities: [],
              targeted: false,
              selectInfo: { selectable: false, selected: false },
            }),
          ),
        ),
      );
      return slots.map((slot) => sleeveUrl(appearanceStore[slot]));
    }, customSleeves);
    await expect(page.getByTestId("duel-card")).toHaveCount(100);
    const geometry = await page.evaluate(async () => {
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      return [0, 1].flatMap((controller) =>
        ["DECK", "EXTRA"].map((zone) => {
          const layers = [
            ...document.querySelectorAll(
              `[data-testid="duel-card"][data-card-controller="${controller}"][data-card-zone="${zone}"]`,
            ),
          ].flatMap((card) => {
            const surface = card.querySelector(
              '[class*="img-wrap"], [data-testid="duel-stack-surface"]',
            );
            if (!surface || getComputedStyle(card).visibility === "hidden")
              return [];
            const rect = surface.getBoundingClientRect();
            return [
              { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
            ];
          });
          const bottom = layers[0],
            top = layers[layers.length - 1];
          return {
            controller,
            zone,
            layers: layers.length,
            spread: Math.hypot(top.x - bottom.x, top.y - bottom.y),
          };
        }),
      );
    });
    console.log("Stack thickness:", JSON.stringify(geometry));
    for (const { zone, spread, layers } of geometry) {
      // 35 张主卡组约为 12px，15 张额外约为 5px；仅顶层三张不足 1px。
      expect(spread).toBeGreaterThan(zone === "DECK" ? 10 : 4);
      expect(layers).toBe(zone === "DECK" ? 35 : 15);
    }
    await expect(page.getByTestId("duel-stack-surface")).toHaveCount(88);
    await expect(
      page.locator('[data-testid="duel-card"] [class*="img-wrap"]'),
    ).toHaveCount(12);
    for (const controller of [0, 1]) {
      for (const [index, zone] of ["DECK", "EXTRA"].entries()) {
        const covered = source(page, `${controller}-${zone}-0`);
        await expect(covered).toHaveCSS("pointer-events", "none");
        const surface = covered.getByTestId("duel-stack-surface");
        await expect(surface).toHaveAttribute(
          "src",
          sleeves[controller * 2 + index],
        );
        await expect
          .poll(() =>
            surface.evaluate(
              (image: HTMLImageElement) =>
                image.complete && image.naturalWidth > 0,
            ),
          )
          .toBe(true);
      }
    }
    const rect = await source(page, "0-DECK-0").boundingBox();
    await page.screenshot({
      path: info.outputPath("deck-stack.png"),
      clip: {
        x: rect!.x - 40,
        y: rect!.y - 40,
        width: rect!.width + 80,
        height: rect!.height + 80,
      },
      animations: "disabled",
    });
    // 翻转和抽出下层卡片后，表面跟随状态更新，完整卡片仍按原流程恢复。
    await send(page, [37]);
    await expect(
      source(page, "0-DECK-0").getByTestId("duel-stack-surface"),
    ).toHaveAttribute("src", /\/1000001\.webp$/);
    await expect(
      source(page, "0-DECK-1").getByTestId("duel-stack-surface"),
    ).toHaveAttribute("src", sleeves[0]);
    await send(page, [37]);
    await expect(
      source(page, "0-DECK-0").getByTestId("duel-stack-surface"),
    ).toHaveAttribute("src", sleeves[0]);
    await send(page, [50, ...u32(1000001), 0, 1, 0, 2, 0, 2, 0, 2, ...u32(0)]);
    await expect(source(page, "0-DECK-0")).toHaveAttribute(
      "data-card-zone",
      "HAND",
    );
    await expect(
      source(page, "0-DECK-0").getByTestId("duel-stack-surface"),
    ).toHaveCount(0);
    await expect(
      source(page, "0-DECK-0").locator('[class*="img-wrap"]'),
    ).toHaveCount(1);
    await send(page, [32, 0]);
    await expect(page.getByTestId("duel-stack-surface")).toHaveCount(87);
    await expect(
      source(page, "0-DECK-1").getByTestId("duel-stack-surface"),
    ).toHaveAttribute("src", sleeves[0]);
    if (customSleeves) {
      // 切换卡套立即更新下层表面；图片加载失败时回退到默认卡背。
      const failedSleeve = await page.evaluate(async () => {
        const { sleeveCatalog, sleeveUrl } = await import(
          "/src/stores/appearanceStore.ts"
        );
        return sleeveUrl(sleeveCatalog[5].id);
      });
      await page.route(`**${failedSleeve}`, (route) =>
        route.fulfill({ status: 404, body: "" }),
      );
      const defaultBack = await page.evaluate(async () => {
        const { appearanceStore, sleeveUrl } = await import(
          "/src/stores/appearanceStore.ts"
        );
        appearanceStore.meMain = "default";
        return sleeveUrl("default");
      });
      const surface = source(page, "0-DECK-1").getByTestId(
        "duel-stack-surface",
      );
      await expect(surface).toHaveAttribute("src", defaultBack);
      const failedResponse = page.waitForResponse(
        (response) =>
          response.url().endsWith(failedSleeve) && response.status() === 404,
      );
      await page.evaluate(async () => {
        const { appearanceStore, sleeveCatalog } = await import(
          "/src/stores/appearanceStore.ts"
        );
        appearanceStore.meMain = sleeveCatalog[5].id;
      });
      await failedResponse;
      await expect(surface).toHaveJSProperty(
        "src",
        new URL(defaultBack, page.url()).href,
      );
      await expect
        .poll(() =>
          surface.evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
        )
        .toBe(true);
    }
  });
}

test("a covered chain source restores its contents for focus and hides them afterward", async ({
  page,
}) => {
  await setup(page, true);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { genCard } = await import("/src/service/utils/genCard.ts");
    const { fetchCard, ygopro } = await import("/src/api/index.ts");
    cardStore.inner.push(
      ...Array.from({ length: 4 }, (_, index) =>
        genCard({
          uuid: `cover-${index}`,
          code: 1000004,
          meta: fetchCard(1000004),
          location: new ygopro.CardLocation({
            controller: 1,
            zone: ygopro.CardZone.GRAVE,
            sequence: index + 1,
            position: ygopro.CardPosition.FACEUP_ATTACK,
          }),
          counters: {},
          idleInteractivities: [],
          selectInfo: { selectable: false, selected: false },
          status: 0,
          isToken: false,
          targeted: false,
        }),
      ),
    );
  });
  const covered = source(page, "grave");
  await expect(covered.locator('[class*="img-wrap"]')).toHaveCount(0);
  await expect(covered.getByTestId("duel-stack-surface")).toBeVisible();
  await page.evaluate(
    (payload) => {
      window.__focusCovered = window.__chainSend(payload);
    },
    [70, ...u32(1000002), 1, 16, 0, 0, 1, 16, 0, ...u32(0), 1],
  );
  await expect(covered).toHaveAttribute("data-card-focusing", "true");
  await expect(covered.locator('[class*="img-wrap"]')).toBeVisible();
  await expect(covered.getByTestId("duel-stack-surface")).toHaveCount(0);
  await page.evaluate(() => window.__focusCovered);
  await expect(covered.locator('[class*="img-wrap"]')).toHaveCount(0);
  await expect(covered.getByTestId("duel-stack-surface")).toBeVisible();
  await expect(page.getByTestId("duel-chain-card")).toHaveCount(1);
});

test("card size animation changes transforms while layout dimensions stay fixed", async ({
  page,
}) => {
  await setup(page, true);
  const samples = await page.evaluate(async () => {
    const element = document.querySelector('[data-card-uuid="hand"]')!;
    const samples: number[] = [];
    let frame: number;
    const sample = () => {
      samples.push(parseFloat(getComputedStyle(element).height));
      frame = requestAnimationFrame(sample);
    };
    sample();
    try {
      await window.__chainSend([
        50, 65, 66, 15, 0, 1, 2, 0, 2, 1, 4, 2, 1, 0, 0, 0, 0,
      ]);
    } finally {
      cancelAnimationFrame(frame!);
    }
    return samples;
  });
  expect(samples.length).toBeGreaterThan(2);
  expect(samples.every((height) => height === 120)).toBe(true);
  await expect(source(page, "hand")).toHaveAttribute("data-card-zone", "MZONE");
});

async function setupBattle(page: Page) {
  await setup(page);
  await send(page, [50, ...u32(1000001), 1, 2, 0, 2, 1, 4, 0, 1, ...u32(0)]);
  for (const sequence of [1, 2])
    await send(page, [
      50,
      ...u32(1000002),
      0,
      0,
      0,
      0,
      0,
      4,
      sequence,
      1,
      ...u32(0),
    ]);
  await page.evaluate(async () => {
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    const { matStore } = await import("/src/stores/index.ts");
    matStore.initInfo.set(0, { life: 8000 });
    matStore.initInfo.set(1, { life: 8000 });
    settingStore.saveAnimationConfig({ enabled: true, speed: 0.7 });
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
}
const declaration = (sequence = 1) => [110, 1, 4, 0, 1, 0, 4, sequence, 1];
const battleMessage = (sequence = 1, attack = 3000, direct = false) => [
  111,
  1,
  4,
  0,
  1,
  ...u32(attack),
  ...u32(2000),
  0,
  ...(direct ? [0, 0, 0, 0] : [0, 4, sequence, 1]),
  ...u32(2000),
  ...u32(1500),
  0,
];
const attackerToGrave = () => [
  50,
  ...u32(1000001),
  1,
  4,
  0,
  1,
  1,
  16,
  0,
  1,
  ...u32(0),
];

async function queueBattle(page: Page, messages: number[][], combined = false) {
  await page.evaluate(
    async ({ messages, combined }) => {
      const { default: handle } = await import(
        "/src/service/onSocketMessage.ts"
      );
      const { getUIContainer } = await import("/src/container/compat.ts");
      const frames = messages.map((payload) => {
        const frame = new Uint8Array(payload.length + 3);
        new DataView(frame.buffer).setUint16(0, payload.length + 1, true);
        frame[2] = 1;
        frame.set(payload, 3);
        return frame;
      });
      const inputs = combined
        ? [Uint8Array.from(frames.flatMap((frame) => [...frame]))]
        : frames;
      window.__battleDone = false;
      void Promise.all(
        inputs.map((frame) =>
          handle(
            getUIContainer(),
            new MessageEvent("message", { data: frame.buffer }),
          ),
        ),
      ).then(() => {
        window.__battleDone = true;
      });
    },
    { messages, combined },
  );
}

test("attack declaration survives the response window and damage-step start without rushing", async ({
  page,
}, info) => {
  await setupBattle(page);
  const attacker = source(page, "hand");
  const before = await attacker.evaluate((element) => element.style.transform);
  await send(page, declaration());
  const arrow = page.getByTestId("duel-attack-declaration");
  await expect(arrow).toHaveAttribute(
    "data-target",
    await page
      .locator(
        '[data-card-controller="0"][data-card-zone="MZONE"][data-card-sequence="1"]',
      )
      .getAttribute("data-card-uuid"),
  );
  await expect(attacker).toHaveAttribute("data-card-attacking", "false");
  await page.screenshot({ path: info.outputPath("attack-declaration.png") });
  await send(page, [
    16,
    0,
    1,
    1,
    ...u32(0),
    ...u32(0),
    0,
    0,
    ...u32(1000002),
    0,
    4,
    1,
    0,
    ...u32(0),
  ]);
  await expect(page.getByTestId("duel-select-cards-modal")).toBeVisible();
  await expect(arrow).toHaveCount(1);
  expect(await attacker.evaluate((element) => element.style.transform)).toBe(
    before,
  );
  await page.getByTestId("duel-select-card-cancel").click();
  await send(page, [113]);
  await expect(page.getByTestId("duel-phase-step")).toHaveText("02");
  await expect(arrow).toHaveCount(1);
  await expect(attacker).toHaveAttribute("data-card-attacking", "false");
  await send(page, [112]);
  await expect(arrow).toHaveCount(0);
  expect(await attacker.evaluate((element) => element.style.transform)).toBe(
    before,
  );
});

for (const skip of ["disabled", "background"]) {
  test(`battle and following movement finish when presentation becomes ${skip}`, async ({
    page,
  }) => {
    await setupBattle(page);
    await queueBattle(page, [battleMessage(), attackerToGrave()]);
    await expect(source(page, "hand")).toHaveAttribute(
      "data-card-attacking",
      "true",
    );
    await page.evaluate(async (skip) => {
      if (skip === "disabled") {
        const { settingStore } = await import(
          "/src/stores/settingStore/index.ts"
        );
        settingStore.animation.enabled = false;
      } else {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event("visibilitychange"));
      }
    }, skip);
    await expect
      .poll(() => page.evaluate(() => window.__battleDone))
      .toBe(true);
    await expect(source(page, "hand")).toHaveAttribute(
      "data-card-zone",
      "GRAVE",
    );
    await expect(source(page, "hand")).toHaveAttribute(
      "data-card-attacking",
      "false",
    );
    await expect(page.getByTestId("duel-attack-declaration")).toHaveCount(0);
  });
}

for (const combined of [false, true]) {
  test(`final BATTLE target and damage synchronize at impact across ${
    combined ? "one frame" : "separate frames"
  }`, async ({ page }) => {
    await setupBattle(page);
    await send(page, declaration(1));
    await page.evaluate(() => {
      window.__impactPose = undefined;
      const observer = new MutationObserver(() => {
        if (!document.querySelector('[data-testid="duel-life-change"]')) return;
        const card = document.querySelector('[data-card-uuid="hand"]')!;
        const matrix = new DOMMatrix((card as HTMLElement).style.transform);
        window.__impactPose = {
          x: matrix.m41,
          y: matrix.m42,
          zone: card.getAttribute("data-card-zone"),
        };
        observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
    await queueBattle(
      page,
      [
        battleMessage(2, 4100),
        // 普通 UpdateCard 查询不应破坏命中与后续 Damage 的衔接。
        [7, 1, 4, 0, ...u32(12), ...u32(0x100), ...u32(4100)],
        [91, 0, ...u32(1000)],
        attackerToGrave(),
      ],
      combined,
    );
    const change = page.getByTestId("duel-life-change");
    await expect(change).toHaveAttribute("data-amount", "-1000");
    await expect(source(page, "hand")).toHaveAttribute(
      "data-card-attacking",
      "true",
    );
    const pose = await page.evaluate(() => window.__impactPose);
    expect(pose.zone).toBe("MZONE");
    expect(pose.x).toBeCloseTo(0);
    expect(pose.y).toBeCloseTo(130);
    await expect(
      page.getByTestId("duel-player-life-value").filter({ hasText: "7000" }),
    ).toHaveCount(1);
    await expect(page.getByTestId("duel-attack-declaration")).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => window.__battleDone))
      .toBe(true);
    await expect(source(page, "hand")).toHaveAttribute(
      "data-card-zone",
      "GRAVE",
    );
  });
}

test("only the final defender shakes at impact, then returns without rendering other cards", async ({
  page,
}) => {
  await trackCardRenders(page);
  await setupBattle(page);
  await send(page, declaration(1));
  const result = await page.evaluate(
    async (messages) => {
      const attacker = document.querySelector<HTMLElement>(
        '[data-card-uuid="hand"]',
      )!;
      const target = document.querySelector<HTMLElement>(
        '[data-card-controller="0"][data-card-zone="MZONE"][data-card-sequence="2"]',
      )!;
      const others = [
        ...document.querySelectorAll<HTMLElement>('[data-testid="duel-card"]'),
      ].filter((element) => element !== attacker && element !== target);
      const before = target.style.transform;
      const origin = new DOMMatrix(before);
      const from = new DOMMatrix(attacker.style.transform);
      const dx = origin.m41 - from.m41,
        dy = origin.m42 - from.m42;
      const distance = Math.hypot(dx, dy);
      const otherTransforms = others.map((element) => element.style.transform);
      let othersStable = true;
      const offsets: number[] = [];
      let impact: { x: number; y: number; damage: boolean } | undefined;
      let impactRenders = 0;
      const uuid = target.dataset.cardUuid!;
      const observer = new MutationObserver(() => {
        othersStable &&= others.every(
          (element, index) =>
            element.style.transform === otherTransforms[index],
        );
        if (target.style.transform === before) return;
        const pose = new DOMMatrix(target.style.transform);
        offsets.push(
          ((pose.m41 - origin.m41) * dx + (pose.m42 - origin.m42) * dy) /
            distance,
        );
        if (!impact) {
          const pose = new DOMMatrix(attacker.style.transform);
          impact = {
            x: pose.m41,
            y: pose.m42,
            damage: !!document.querySelector(
              '[data-testid="duel-life-change"]',
            ),
          };
          impactRenders = window.__cardRenders[uuid] ?? 0;
        }
      });
      observer.observe(target, {
        attributes: true,
        attributeFilter: ["style"],
      });
      others.forEach((element) =>
        observer.observe(element, {
          attributes: true,
          attributeFilter: ["style"],
        }),
      );
      window.__cardRenders = {};
      await Promise.all(messages.map((message) => window.__chainSend(message)));
      observer.disconnect();
      return {
        before,
        after: target.style.transform,
        offsets,
        impact,
        impactRenders,
        finalRenders: window.__cardRenders[uuid] ?? 0,
        othersStable,
        unrelatedRenders: others.map(
          (element) => window.__cardRenders[element.dataset.cardUuid!] ?? 0,
        ),
      };
    },
    [battleMessage(2), [91, 0, ...u32(1000)], [114]],
  );
  expect(result.impact).toBeDefined();
  expect(result.impact!.x).toBeCloseTo(0);
  expect(result.impact!.y).toBeCloseTo(130);
  expect(result.impact!.damage).toBe(true);
  expect(Math.max(...result.offsets)).toBeGreaterThan(8);
  expect(Math.min(...result.offsets)).toBeLessThan(-5);
  expect(Math.max(...result.offsets.map(Math.abs))).toBeLessThanOrEqual(12.01);
  expect(result.after).toBe(result.before);
  expect(result.finalRenders).toBe(result.impactRenders);
  expect(result.othersStable).toBe(true);
  expect(result.unrelatedRenders.every((count) => count === 0)).toBe(true);
});

for (const skip of ["disabled", "background", "reset"]) {
  test(`defender shake clears immediately when ${skip} interrupts impact`, async ({
    page,
  }) => {
    await setupBattle(page);
    const target = page.locator(
      '[data-card-controller="0"][data-card-zone="MZONE"][data-card-sequence="1"]',
    );
    const before = await target.evaluate((element) => element.style.transform);
    // 在首次受击位移时中断，避免测试轮询错过短暂抖动。
    await target.evaluate(async (element, skip) => {
      const { settingStore } = await import(
        "/src/stores/settingStore/index.ts"
      );
      const { resetDuelDialogs } = await import("/src/stores/duelDialogs.ts");
      const before = element.style.transform;
      element.dataset.hitInterrupted = "false";
      const observer = new MutationObserver(() => {
        if (element.style.transform === before) return;
        observer.disconnect();
        element.dataset.hitInterrupted = "true";
        if (skip === "disabled") settingStore.animation.enabled = false;
        else if (skip === "reset") resetDuelDialogs();
        else {
          Object.defineProperty(document, "hidden", {
            configurable: true,
            value: true,
          });
          document.dispatchEvent(new Event("visibilitychange"));
        }
      });
      observer.observe(element, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }, skip);
    await queueBattle(page, [battleMessage(), [114]]);
    await expect
      .poll(() => page.evaluate(() => window.__battleDone))
      .toBe(true);
    await expect(source(page, "hand")).toHaveAttribute(
      "data-card-attacking",
      "false",
    );
    await expect(target).toHaveAttribute("data-hit-interrupted", "true");
    expect(await target.evaluate((element) => element.style.transform)).toBe(
      before,
    );
    await send(page, [94, 0, ...u32(7500)]);
    await expect(
      page.locator('[data-testid="duel-player-life-value"][data-player="me"]'),
    ).toHaveText("7500");
  });
}

for (const mode of ["direct", "disabled", "seeking"]) {
  test(`defenders stay still during ${mode} battles`, async ({ page }) => {
    await setupBattle(page);
    const result = await page.evaluate(
      async ({ mode, messages }) => {
        const { settingStore } = await import(
          "/src/stores/settingStore/index.ts"
        );
        const { replayPresentation } = await import(
          "/src/infra/replayPresentation.ts"
        );
        settingStore.animation.enabled = mode !== "disabled";
        replayPresentation.seeking = mode === "seeking";
        const defenders = [
          ...document.querySelectorAll<HTMLElement>(
            '[data-card-controller="0"][data-card-zone="MZONE"]',
          ),
        ];
        const before = defenders.map((element) => element.style.transform);
        let moved = false;
        const observer = new MutationObserver(() => {
          moved ||= defenders.some(
            (element, index) => element.style.transform !== before[index],
          );
        });
        defenders.forEach((element) =>
          observer.observe(element, {
            attributes: true,
            attributeFilter: ["style"],
          }),
        );
        try {
          await Promise.all(
            messages.map((message) => window.__chainSend(message)),
          );
        } finally {
          replayPresentation.seeking = false;
          observer.disconnect();
        }
        return moved;
      },
      { mode, messages: [battleMessage(1, 3000, mode === "direct"), [114]] },
    );
    expect(result).toBe(false);
  });
}

test("zero-damage battle animates and holds the following move until return", async ({
  page,
}) => {
  await setupBattle(page);
  await send(page, declaration());
  await queueBattle(page, [battleMessage(1, 2000), attackerToGrave()]);
  await expect(source(page, "hand")).toHaveAttribute(
    "data-card-attacking",
    "true",
  );
  await expect(page.getByTestId("duel-attack-declaration")).toHaveCount(0);
  await expect(source(page, "hand")).toHaveAttribute("data-card-zone", "MZONE");
  await expect(page.getByTestId("duel-life-change")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__battleDone)).toBe(true);
  await expect(source(page, "hand")).toHaveAttribute("data-card-zone", "GRAVE");
});

test("retargeting, phase changes and leaving cards clear declarations; missing defenders do not become direct attacks", async ({
  page,
}, info) => {
  await setupBattle(page);
  const arrow = page.getByTestId("duel-attack-declaration");
  await send(page, declaration(1));
  const first = await arrow.getAttribute("data-target");
  await send(page, declaration(2));
  await expect(arrow).not.toHaveAttribute("data-target", first!);
  await send(page, [41, 4, 0]); // MAIN1
  await expect(arrow).toHaveCount(0);
  await send(page, declaration());
  await send(page, attackerToGrave());
  await expect(arrow).toHaveCount(0);
  await send(page, [50, ...u32(1000001), 1, 16, 0, 1, 1, 4, 0, 1, ...u32(0)]);
  await send(page, declaration());
  await send(page, battleMessage(4)); // 不存在的防守卡
  await expect(arrow).toHaveCount(0);
  await expect(source(page, "hand")).toHaveAttribute(
    "data-card-attacking",
    "false",
  );
  await send(page, [110, 1, 4, 0, 1, 0, 0, 0, 0]);
  await expect(arrow).toHaveAttribute("data-target", "direct");
  await page.screenshot({ path: info.outputPath("direct-attack-arrow.png") });
  await queueBattle(page, [
    battleMessage(0, 3000, true),
    [91, 0, ...u32(3000)],
    [114],
  ]);
  await expect(page.getByTestId("duel-life-change")).toHaveAttribute(
    "data-amount",
    "-3000",
  );
  await expect(source(page, "hand")).toHaveAttribute(
    "data-card-attacking",
    "true",
  );
  await expect.poll(() => page.evaluate(() => window.__battleDone)).toBe(true);
  await expect(page.getByTestId("duel-phase-step")).toHaveText("01");
});

test("reset during battle releases its wait, restores the card and allows subsequent messages", async ({
  page,
}) => {
  await setupBattle(page);
  const attacker = source(page, "hand");
  const before = await attacker.evaluate((element) => element.style.transform);
  await queueBattle(page, [battleMessage()]);
  await expect(attacker).toHaveAttribute("data-card-attacking", "true");
  await page.evaluate(async () => {
    const { resetDuelDialogs } = await import("/src/stores/duelDialogs.ts");
    resetDuelDialogs();
  });
  await expect.poll(() => page.evaluate(() => window.__battleDone)).toBe(true);
  await expect(attacker).toHaveAttribute("data-card-attacking", "false");
  await expect(page.getByTestId("duel-attack-declaration")).toHaveCount(0);
  expect(await attacker.evaluate((element) => element.style.transform)).toBe(
    before,
  );
  await send(page, [94, 0, ...u32(7500)]);
  await expect(
    page.locator('[data-testid="duel-player-life-value"][data-player="me"]'),
  ).toHaveText("7500");
});

test("attack animations return to the same position after direct and targeted attacks", async ({
  page,
}) => {
  await setup(page, true);
  await send(page, [50, ...u32(1000001), 1, 2, 0, 2, 1, 4, 2, 1, ...u32(0)]);
  const results = await page.evaluate(async () => {
    const { callCardAttack } = await import(
      "/src/ui/Duel/PlayMat/Card/index.tsx"
    );
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    settingStore.saveAnimationConfig({ enabled: true, speed: 0.7 });
    const element = document.querySelector<HTMLElement>(
      '[data-card-uuid="hand"]',
    )!;
    const face = element.querySelector('[class*="img-wrap"]')!;
    const results = [];
    for (const options of [
      { directAttack: true },
      {
        directAttack: false,
        target: new ygopro.CardLocation({
          controller: 0,
          zone: ygopro.CardZone.MZONE,
          sequence: 1,
        }),
      },
    ]) {
      const before = element.style.transform;
      const initialRotation = Number(
        before.match(/rotateZ\(([-\d.]+)deg\)/)![1],
      );
      const transforms = new Set<string>();
      let maxDepth = 0;
      let maxRotation = 0;
      let frame: number;
      const sample = () => {
        transforms.add(element.style.transform);
        const rotation = Number(
          element.style.transform.match(/rotateZ\(([-\d.]+)deg\)/)![1],
        );
        maxRotation = Math.max(
          maxRotation,
          Math.abs(rotation - initialRotation),
        );
        maxDepth = Math.max(
          maxDepth,
          new DOMMatrix(getComputedStyle(face).transform).m43,
        );
        frame = requestAnimationFrame(sample);
      };
      sample();
      const started = performance.now();
      await callCardAttack("hand", options);
      cancelAnimationFrame(frame!);
      results.push({
        before,
        after: element.style.transform,
        elapsed: performance.now() - started,
        maxDepth,
        maxRotation,
        poses: transforms.size,
      });
    }
    return results;
  });
  for (const result of results) {
    expect(result.after).toBe(result.before);
    expect(result.maxDepth).toBeGreaterThan(190);
    expect(result.maxRotation).toBeLessThanOrEqual(90);
    expect(result.poses).toBeGreaterThan(3);
    expect(result.elapsed).toBeGreaterThanOrEqual(350);
    expect(result.elapsed).toBeLessThan(1200);
  }
});

test("attack stages use explicit durations, animation speed and replay speed", async ({
  page,
}) => {
  await setup(page);
  const cases = await page.evaluate(async () => {
    const { attack } = await import(
      "/src/ui/Duel/PlayMat/Card/springs/attack.ts"
    );
    const { cardStore } = await import("/src/stores/index.ts");
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    const { replayPresentation } = await import(
      "/src/infra/replayPresentation.ts"
    );
    const results = [];
    for (const speed of [0, 0.7, 1]) {
      for (const replaySpeed of [1, 2]) {
        settingStore.saveAnimationConfig({ enabled: true, speed });
        replayPresentation.speed = replaySpeed;
        const initial = { x: 20, y: 100, z: 0, rz: 180, zIndex: 3 };
        let current = { ...initial };
        const durations = [];
        const api = {
          current: [{ get: () => current, springs: {} }],
          start: ({ config, immediate: _immediate, ...values }) => {
            if (config?.duration !== undefined) durations.push(config.duration);
            current = { ...current, ...values };
            return [Promise.resolve()];
          },
          set: (values) => {
            current = { ...current, ...values };
          },
          stop: () => {},
        };
        await attack({
          card: cardStore.inner[0],
          api,
          options: { directAttack: true, attack: 2500 },
        });
        results.push({
          durations,
          current,
          initial,
          expected: (800 * (400 - speed * 300)) / 190 / replaySpeed,
        });
      }
    }
    replayPresentation.speed = 1;
    return results;
  });
  for (const { durations, current, initial, expected } of cases) {
    expect(durations).toHaveLength(4);
    expect(durations.every((duration) => duration > 0)).toBe(true);
    expect(durations.reduce((sum, duration) => sum + duration, 0)).toBeCloseTo(
      expected,
    );
    expect(current).toEqual(initial);
  }
});

async function expectFace(card: Locator, faceUp: boolean) {
  await expect
    .poll(() =>
      card.evaluate((element) => {
        const face = element.querySelector('[class*="img-wrap"]')!;
        return new DOMMatrix(getComputedStyle(face).transform).m33;
      }),
    )
    .toBeCloseTo(faceUp ? 1 : -1, 4);
}

test("chain cards survive animation, movement and resolution until the entire chain ends", async ({
  page,
}, info) => {
  await setup(page, true);
  await activate(page, 1000002, 16);
  await activate(page, 1000003, 32);
  const entries = page.getByTestId("duel-chain-card");
  await expect(entries).toHaveCount(2);
  await expect(source(page, "grave")).toHaveAttribute(
    "data-card-focusing",
    "false",
  );
  await expect(source(page, "removed")).toHaveAttribute(
    "data-card-focusing",
    "false",
  );
  // 发动卡离场后仍可读发动时的卡片资料。
  await send(page, [50, ...u32(1000003), 1, 32, 0, 1, 1, 0, 0, 1, ...u32(0)]);
  await expect(source(page, "removed")).toHaveCount(0);
  await entries.nth(1).click();
  await expect(page.getByTestId("duel-card-detail")).toHaveAttribute(
    "data-card-code",
    "1000003",
  );
  await send(page, [73, 2]);
  await expect(entries.nth(1)).toHaveAttribute("data-solved", "true");
  await expect(entries.nth(0)).toHaveAttribute("data-chain-index", "1");
  await expect(entries.nth(0)).toHaveAttribute("data-solved", "false");
  await send(page, [73, 1]);
  await expect(entries).toHaveCount(2);
  await expect(entries.nth(0)).toHaveAttribute("data-solved", "true");
  await page.screenshot({ path: info.outputPath("chain-cards-resolved.png") });
  await send(page, [74]);
  await expect(page.getByTestId("duel-chain-cards")).toHaveCount(0);
  expect(await page.evaluate(() => window.__sent)).toEqual([]);
});

test("revealed hands stay face up through layout changes and hide after a shuffle", async ({
  page,
}) => {
  await setup(page);
  await expectFace(source(page, "hand"), false);
  await send(page, [31, 1, 0, 1, ...u32(1000001), 1, 2, 0]);

  await expectFace(source(page, "hand"), true);
  // 新的未知手牌入手引起整手重排，不应盖回已经公开的卡。
  await send(page, [50, ...u32(0), 1, 0, 0, 2, 1, 2, 1, 2, ...u32(0)]);
  await expectFace(source(page, "hand"), true);
  await activate(page, 1000001, 2);
  await send(page, [33, 1, 2, ...u32(0), ...u32(0)]);
  await expectFace(source(page, "hand"), false);
  await expect(source(page, "hand")).toHaveAttribute("data-card-code", "0");
  await expect(page.getByTestId("duel-chain-card")).toHaveAttribute(
    "data-card-code",
    "1000001",
  );
  await expect(page.getByTestId("duel-chain-marker")).toHaveCount(0);
  await page.getByTestId("duel-chain-card").click();
  await expect(page.getByTestId("duel-card-detail")).toHaveAttribute(
    "data-card-code",
    "1000001",
  );
  const meta = await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    return cardStore.inner.find((card) => card.uuid === "hand")!.meta.id;
  });
  expect(meta).toBe(0);
  // 洗牌消息若继续公开另一位置的卡，只翻开服务器指定的那张。
  await send(page, [33, 1, 2, ...u32(0), ...u32(1000001)]);
  await expectFace(source(page, "hand"), false);
  await expectFace(
    page.locator('[data-card-zone="HAND"][data-card-sequence="1"]'),
    true,
  );
  await expect(page.getByTestId("duel-chain-marker")).toHaveCount(0);
});

test("hand activation reveals the card without changing unknown neighboring cards", async ({
  page,
}) => {
  await setup(page);
  await send(page, [50, ...u32(0), 1, 0, 0, 2, 1, 2, 1, 2, ...u32(0)]);
  await activate(page, 1000001, 2);
  await expectFace(source(page, "hand"), true);
  const unknown = page.locator(
    '[data-card-zone="HAND"][data-card-sequence="1"]',
  );
  await expectFace(unknown, false);
  await activate(page, 1000001, 2);
  const entries = page.getByTestId("duel-chain-card");
  await expect(entries).toHaveCount(2);
  await expect(entries.nth(1)).toHaveAttribute("data-chain-index", "2");
  const markers = source(page, "hand").getByTestId("duel-chain-marker");
  await expect(markers).toHaveCount(2);
  await expect(markers.nth(0)).toHaveText("1");
  await expect(markers.nth(1)).toHaveText("2");
  await send(page, [73, 2]);
  await expect(entries.nth(0)).toHaveAttribute("data-solved", "false");
  await expect(entries.nth(1)).toHaveAttribute("data-solved", "true");
  await send(page, [74]);
  await expectFace(source(page, "hand"), true);
  await expect(markers).toHaveCount(0);
});

test("chain numbers follow the actual card and do not label a different card covering it", async ({
  page,
}, info) => {
  await setup(page);
  await activate(page, 1000002, 16);
  const marker = page.getByTestId("duel-chain-marker");
  await expect(marker).toHaveAttribute("data-card-uuid", "grave");
  await expect(marker).toHaveText("1");
  // 墓地顶新放了一张卡，不能把下面发动卡的编号显示到新卡上。
  await send(page, [50, ...u32(1000004), 1, 0, 0, 1, 1, 16, 1, 1, ...u32(0)]);
  await expect(marker).toHaveCount(0);
  await expect(page.getByTestId("duel-chain-card")).toHaveAttribute(
    "data-card-code",
    "1000002",
  );
  await send(page, [50, ...u32(1000004), 1, 16, 1, 1, 1, 0, 0, 1, ...u32(0)]);
  await expect(marker).toHaveAttribute("data-card-uuid", "grave");
  // 原卡换区，编号跟随卡片，不留在墓地区域。
  await send(page, [50, ...u32(1000002), 1, 16, 0, 1, 1, 4, 2, 1, ...u32(0)]);
  await expect(marker).toHaveAttribute("data-chain-zone", "MZONE");
  await expect(marker).toHaveAttribute("data-chain-sequence", "2");
  const cardBox = await source(page, "grave").boundingBox();
  const markerBox = await marker.boundingBox();
  expect(markerBox!.x + markerBox!.width / 2).toBeGreaterThan(cardBox!.x);
  expect(markerBox!.x + markerBox!.width / 2).toBeLessThan(
    cardBox!.x + cardBox!.width,
  );
  expect(markerBox!.y + markerBox!.height / 2).toBeGreaterThan(cardBox!.y);
  expect(markerBox!.y + markerBox!.height / 2).toBeLessThan(
    cardBox!.y + cardBox!.height,
  );
  await page.screenshot({
    path: info.outputPath("chain-marker-alignment.png"),
  });

  // 小屏同时检查手牌、场上卡和除外区，编号不能落到相邻卡片上。
  await activate(page, 1000001, 2);
  await activate(page, 1000003, 32);
  await page.setViewportSize({ width: 844, height: 390 });
  for (const uuid of ["grave", "hand", "removed"]) {
    const card = source(page, uuid);
    await expect
      .poll(async () => {
        const face = await card.locator('[class*="img-wrap"]').boundingBox();
        const badge = await card.getByTestId("duel-chain-marker").boundingBox();
        const x = badge!.x + badge!.width / 2;
        const y = badge!.y + badge!.height / 2;
        return (
          x > face!.x &&
          x < face!.x + face!.width &&
          y > face!.y &&
          y < face!.y + face!.height
        );
      })
      .toBe(true);
  }
  await page.screenshot({
    path: info.outputPath("chain-marker-alignment-mobile.png"),
  });

  // 盖卡洗切后，即使同一位置重新公开相同卡号，也不恢复旧的编号关联。
  await page.evaluate(async () => {
    const { default: shuffle } = await import(
      "/src/service/duel/shuffleSetCard.ts"
    );
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { cardStore } = await import("/src/stores/index.ts");
    const { fetchCard, ygopro } = await import("/src/api/index.ts");
    const card = cardStore.inner.find((card) => card.uuid === "grave")!;
    await shuffle(getUIContainer(), {
      from_locations: [card.location],
      overlay_locations: [new ygopro.CardLocation()],
    });
    card.code = 1000002;
    card.meta = fetchCard(1000002);
  });
  await expect(
    source(page, "grave").getByTestId("duel-chain-marker"),
  ).toHaveCount(0);
  await expect(page.getByTestId("duel-chain-card")).toHaveCount(3);
});

test("disconnect, field reload and duel reset clear persistent chain cards", async ({
  page,
}) => {
  await setup(page);
  await activate(page, 1000002, 16);
  await page.evaluate(async () => {
    const { resetDuelDialogs } = await import("/src/stores/duelDialogs.ts");
    resetDuelDialogs(true);
  });
  await expect(page.getByTestId("duel-chain-cards")).toHaveCount(0);
  await activate(page, 1000002, 16);
  await page.evaluate(async () => {
    const { default: reload } = await import(
      "/src/service/duel/reloadField.ts"
    );
    const { getUIContainer } = await import("/src/container/compat.ts");
    reload(getUIContainer(), { actions: [] });
  });
  await expect(page.getByTestId("duel-chain-cards")).toHaveCount(0);
  // 找不到原卡片的发动消息仍携带公开卡号，可以显示连锁记录。
  await activate(page, 1000002, 16);
  await expect(page.getByTestId("duel-chain-card")).toHaveAttribute(
    "data-card-code",
    "1000002",
  );
  await page.evaluate(async () => {
    const { resetDuel } = await import("/src/stores/index.ts");
    resetDuel();
  });
  await expect(page.getByTestId("duel-chain-cards")).toHaveCount(0);
});

test("long chains remain scrollable and readable in a short viewport", async ({
  page,
}, info) => {
  await setup(page);
  await page.setViewportSize({ width: 844, height: 390 });
  for (let i = 0; i < 8; i++) await activate(page, 1000002, 16);
  const panel = page.getByTestId("duel-chain-cards");
  const entries = page.getByTestId("duel-chain-card");
  await expect(entries).toHaveCount(8);
  await entries.last().click();
  await expect(page.getByTestId("duel-card-detail")).toHaveAttribute(
    "data-card-code",
    "1000002",
  );
  const box = await panel.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(390);
  expect(box!.x + box!.width).toBeLessThanOrEqual(844);
  await page.screenshot({ path: info.outputPath("chain-cards-mobile.png") });
});

for (const zone of [2, 4, 16, 32]) {
  test(`activation in zone ${zone} retains the same reading and return time`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-10-12T00:00:00Z") });
    await setup(page, true);
    const uuid = zone === 2 ? "hand" : zone === 16 ? "grave" : "removed";
    if (zone === 4)
      await send(page, [
        50,
        ...u32(1000003),
        1,
        32,
        0,
        1,
        1,
        4,
        2,
        1,
        ...u32(0),
      ]);
    await page.waitForTimeout(800);
    await page.clock.pauseAt(new Date("2026-10-12T00:00:30Z"));
    await page.evaluate(async (uuid) => {
      const { callCardFocus } = await import(
        "/src/ui/Duel/PlayMat/Card/index.tsx"
      );
      window.__pacingReturned = false;
      window.__pacingFinished = false;
      const start = performance.now();
      void callCardFocus(uuid, {
        onReturnStart: () => {
          window.__pacingReturned = true;
        },
      }).then(() => {
        window.__pacingElapsed = performance.now() - start;
        window.__pacingFinished = true;
      });
    }, uuid);
    await page.clock.runFor(400);
    expect(await page.evaluate(() => window.__pacingReturned)).toBe(false);
    await expect(source(page, uuid)).toHaveAttribute(
      "data-card-focusing",
      "true",
    );
    await page.clock.runFor(130);
    expect(await page.evaluate(() => window.__pacingReturned)).toBe(true);
    expect(await page.evaluate(() => window.__pacingFinished)).toBe(false);
    await page.clock.runFor(200);
    expect(await page.evaluate(() => window.__pacingFinished)).toBe(true);
    expect(
      await page.evaluate(() => window.__pacingElapsed),
    ).toBeGreaterThanOrEqual(600);
    expect(await page.evaluate(() => window.__pacingElapsed)).toBeLessThan(700);
    await expect(source(page, uuid)).toHaveAttribute(
      "data-card-focusing",
      "false",
    );
  });
}

test("chain building overlaps return and solving highlights before the result is applied", async ({
  page,
}, info) => {
  await page.clock.install({ time: new Date("2026-10-12T00:00:00Z") });
  await setup(page, true);
  await page.waitForTimeout(800);
  await page.clock.pauseAt(new Date("2026-10-12T00:00:30Z"));
  await page.evaluate(
    (payload) => {
      window.__pacingOrder = [];
      void window
        .__chainSend(payload)
        .then(() => window.__pacingOrder.push(70));
      void window
        .__chainSend([71, 1])
        .then(() => window.__pacingOrder.push(71));
    },
    [70, ...u32(1000002), 1, 16, 0, 0, 1, 16, 0, ...u32(0), 1],
  );
  await page.clock.runFor(520);
  const entry = page.getByTestId("duel-chain-card");
  await expect(entry).toHaveAttribute("data-building", "true");
  await expect(source(page, "grave")).toHaveAttribute(
    "data-card-focusing",
    "true",
  );
  expect(await page.evaluate(() => window.__pacingOrder)).toEqual([70, 71]);
  await page.clock.runFor(180);
  await expect(entry).toHaveAttribute("data-building", "false");
  await expect(source(page, "grave")).toHaveAttribute(
    "data-card-focusing",
    "false",
  );
  await page.evaluate(() => {
    void window.__chainSend([72, 1]).then(() => window.__pacingOrder.push(72));
    void window.__chainSend([73, 1]).then(() => window.__pacingOrder.push(73));
  });
  await page.clock.runFor(100);
  await expect(entry).toHaveAttribute("data-resolving", "true");
  await expect(entry).toHaveAttribute("data-solved", "false");
  await expect(entry).toContainText("处理中");
  expect(await page.evaluate(() => window.__pacingOrder)).toEqual([70, 71]);
  await page.screenshot({ path: info.outputPath("chain-solving.png") });
  await page.clock.runFor(150);
  await expect(entry).toHaveAttribute("data-solved", "true");
  await expect(entry).toHaveAttribute("data-resolving", "false");
  expect(await page.evaluate(() => window.__pacingOrder)).toEqual([
    70, 71, 72, 73,
  ]);
});

for (const [command, kind, duration] of [
  [60, "normal", 120],
  [62, "special", 220],
  [64, "flip", 120],
] as const) {
  test(`${kind} summon keeps its presentation before the following server message without a chain window`, async ({
    page,
  }, info) => {
    await page.clock.install({ time: new Date("2026-10-12T00:00:00Z") });
    await setup(page, true);
    await page.waitForTimeout(800);
    await page.clock.pauseAt(new Date("2026-10-12T00:00:30Z"));
    await page.evaluate(
      ({ payload, command }) => {
        window.__pacingOrder = [];
        void window
          .__chainSend(payload)
          .then(() => window.__pacingOrder.push(command));
        void window
          .__chainSend([command + 1])
          .then(() => window.__pacingOrder.push(command + 1));
      },
      { payload: [command, ...u32(1000001), 1, 4, 2, 1], command },
    );
    await page.clock.runFor(duration / 2);
    const effect = page.getByTestId("duel-summon-effect");
    await expect(effect).toHaveAttribute("data-kind", kind);
    expect(await page.evaluate(() => window.__pacingOrder)).toEqual([]);
    await effect.evaluate((element) => {
      // Playwright 的时钟控制协议计时器，截图时固定 CSS 演出的可见帧。
      for (const animation of element.getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime =
          Number(animation.effect!.getTiming().duration) / 2;
      }
    });
    await page.screenshot({ path: info.outputPath(`summon-${kind}.png`) });
    await page.clock.runFor(duration / 2 + 20);
    await expect(effect).toHaveCount(0);
    expect(await page.evaluate(() => window.__pacingOrder)).toEqual([
      command,
      command + 1,
    ]);
  });
}

test("summon, chain solving, phase and life presentations share animation and replay speeds", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-12T00:00:00Z") });
  await setup(page, true);
  await page.waitForTimeout(800);
  await page.clock.pauseAt(new Date("2026-10-12T00:00:30Z"));
  await page.evaluate(async () => {
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    const { replayPresentation } = await import(
      "/src/infra/replayPresentation.ts"
    );
    const { matStore } = await import("/src/stores/index.ts");
    settingStore.saveAnimationConfig({ enabled: true, speed: 0 });
    replayPresentation.speed = 2;
    matStore.initInfo.set(0, { life: 8000 });
    matStore.initInfo.set(1, { life: 8000 });
    window.__pacingOrder = [];
    void window
      .__chainSend([62, 65, 66, 15, 0, 1, 4, 2, 1])
      .then(() => window.__pacingOrder.push("summon"));
  });
  const scaled = (duration: number) => (duration * 400) / 190 / 2;
  await page.clock.runFor(100);
  await expect
    .poll(() =>
      page
        .getByTestId("duel-summon-effect")
        .locator("i")
        .first()
        .evaluate(
          (element) =>
            parseFloat(getComputedStyle(element).animationDuration) * 1000,
        ),
    )
    .toBeCloseTo(scaled(220), 2);
  await page.clock.runFor(150);
  expect(await page.evaluate(() => window.__pacingOrder)).toEqual(["summon"]);
  await page.evaluate(async () => {
    const { matStore } = await import("/src/stores/index.ts");
    matStore.chainCards = [{ code: 1000001, controller: 1, solved: false }];
    void window
      .__chainSend([72, 1])
      .then(() => window.__pacingOrder.push("solving"));
  });
  await page.clock.runFor(100);
  await expect(page.getByTestId("duel-chain-card")).toHaveAttribute(
    "data-resolving",
    "true",
  );
  expect(await page.evaluate(() => window.__pacingOrder)).toEqual(["summon"]);
  await page.clock.runFor(150);
  expect(await page.evaluate(() => window.__pacingOrder)).toEqual([
    "summon",
    "solving",
  ]);
  await page.evaluate(() => {
    void window
      .__chainSend([41, 4, 0])
      .then(() => window.__pacingOrder.push("phase"));
  });
  await page.clock.runFor(100);
  await expect
    .poll(() =>
      page
        .getByTestId("duel-phase-banner")
        .evaluate(
          (element) =>
            parseFloat(getComputedStyle(element).animationDuration) * 1000,
        ),
    )
    .toBeCloseTo(scaled(500), 2);
  await page.clock.runFor(450);
  expect(await page.evaluate(() => window.__pacingOrder)).toEqual([
    "summon",
    "solving",
    "phase",
  ]);
  await page.evaluate(
    (payload) => {
      void window
        .__chainSend(payload)
        .then(() => window.__pacingOrder.push("life"));
    },
    [91, 0, ...u32(1000)],
  );
  await page.clock.runFor(100);
  await expect
    .poll(() =>
      page
        .getByTestId("duel-life-change")
        .evaluate(
          (element) =>
            parseFloat(getComputedStyle(element).animationDuration) * 1000,
        ),
    )
    .toBeCloseTo(scaled(800), 2);
  await page.clock.runFor(350);
  await expect(
    page.locator('[data-testid="duel-player-life-value"][data-player="me"]'),
  ).toHaveText("7000");
  expect(await page.evaluate(() => window.__pacingOrder)).toEqual([
    "summon",
    "solving",
    "phase",
  ]);
  await page.clock.runFor(450);
  expect(await page.evaluate(() => window.__pacingOrder)).toEqual([
    "summon",
    "solving",
    "phase",
    "life",
  ]);
});

for (const skip of ["disabled", "hidden", "reset"] as const) {
  test(`a ${skip} presentation releases the summon wait immediately`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-10-12T00:00:00Z") });
    await setup(page, true);
    await page.waitForTimeout(800);
    await page.clock.pauseAt(new Date("2026-10-12T00:00:30Z"));
    await page.evaluate(() => {
      window.__pacingFinished = false;
      void window.__chainSend([62, 65, 66, 15, 0, 1, 4, 2, 1]).then(() => {
        window.__pacingFinished = true;
      });
    });
    await page.clock.runFor(50);
    await expect(page.getByTestId("duel-summon-effect")).toBeVisible();
    await page.evaluate(async (skip) => {
      if (skip === "disabled") {
        const { settingStore } = await import(
          "/src/stores/settingStore/index.ts"
        );
        settingStore.saveAnimationConfig({ enabled: false });
      } else if (skip === "hidden") {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          get: () => true,
        });
        document.dispatchEvent(new Event("visibilitychange"));
      } else {
        const { resetDuelDialogs } = await import("/src/stores/duelDialogs.ts");
        resetDuelDialogs();
      }
    }, skip);
    await expect(page.getByTestId("duel-summon-effect")).toHaveCount(0);
    expect(await page.evaluate(() => window.__pacingFinished)).toBe(true);
  });
}

test("drawing several cards staggers their movement and waits for the last card", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-12T00:00:00Z") });
  await setup(page, true);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const { genCard } = await import("/src/service/utils/genCard.ts");
    for (let sequence = 0; sequence < 3; sequence++)
      cardStore.inner.push(
        genCard({
          uuid: `draw-${sequence}`,
          code: 0,
          meta: { id: 0, data: {}, text: {} },
          location: new ygopro.CardLocation({
            controller: 0,
            zone: ygopro.CardZone.DECK,
            sequence,
            position: ygopro.CardPosition.FACEDOWN_ATTACK,
          }),
          idleInteractivities: [],
          counters: {},
          isToken: false,
          targeted: false,
          selectInfo: { selectable: false, selected: false },
          status: 0,
        }),
      );
  });
  await expect(source(page, "draw-2")).toBeAttached();
  await page.waitForTimeout(800);
  await page.clock.pauseAt(new Date("2026-10-12T00:00:30Z"));
  const initial = await Promise.all(
    [0, 1, 2].map((i) => source(page, `draw-${i}`).getAttribute("style")),
  );
  await page.evaluate(
    (payload) => {
      window.__pacingFinished = false;
      void window.__chainSend(payload).then(() => {
        window.__pacingFinished = true;
      });
    },
    [90, 0, 3, ...u32(1000001), ...u32(1000002), ...u32(1000003)],
  );
  await page.clock.runFor(40);
  expect(await source(page, "draw-0").getAttribute("style")).not.toBe(
    initial[0],
  );
  expect(await source(page, "draw-1").getAttribute("style")).toBe(initial[1]);
  expect(await source(page, "draw-2").getAttribute("style")).toBe(initial[2]);
  await page.clock.runFor(60);
  expect(await source(page, "draw-1").getAttribute("style")).not.toBe(
    initial[1],
  );
  expect(await source(page, "draw-2").getAttribute("style")).toBe(initial[2]);
  await page.clock.runFor(60);
  expect(await source(page, "draw-2").getAttribute("style")).not.toBe(
    initial[2],
  );
  expect(await page.evaluate(() => window.__pacingFinished)).toBe(false);
  await page.clock.runFor(220);
  expect(await page.evaluate(() => window.__pacingFinished)).toBe(true);
  for (let i = 0; i < 3; i++)
    await expect(source(page, `draw-${i}`)).toHaveAttribute(
      "data-card-zone",
      "HAND",
    );
});

for (const [command, results] of [
  [130, [0, 1]],
  [131, [3, 6]],
] as const) {
  test(`toss message ${command} keeps each result for 650ms and blocks the following message`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-10-12T00:00:00Z") });
    await setup(page, true);
    await page.waitForTimeout(800);
    await page.clock.pauseAt(new Date("2026-10-12T00:00:30Z"));
    await page.evaluate(
      (payload) => {
        window.__pacingOrder = [];
        void window
          .__chainSend(payload)
          .then(() => window.__pacingOrder.push("toss"));
        void window
          .__chainSend([63])
          .then(() => window.__pacingOrder.push("following"));
      },
      [command, 0, 2, ...results],
    );
    await page.clock.runFor(600);
    expect(await page.evaluate(() => window.__pacingOrder)).toEqual([]);
    await page.clock.runFor(600);
    expect(await page.evaluate(() => window.__pacingOrder)).toEqual([]);
    await page.clock.runFor(110);
    expect(await page.evaluate(() => window.__pacingOrder)).toEqual([
      "toss",
      "following",
    ]);
  });
}
