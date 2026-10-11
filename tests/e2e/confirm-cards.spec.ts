import { expect, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

import { expectCardFace } from "./helpers/card-geometry";

let database: Buffer;
test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER, alias INTEGER DEFAULT 0); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
  );
  for (let i = 0; i < 4; i++) {
    db.run("INSERT INTO datas (id, type) VALUES (?, 1)", [1000001 + i]);
    db.run("INSERT INTO texts VALUES (?, ?, ?)", [
      1000001 + i,
      `展示卡片 ${i + 1}`,
      "公开手卡的测试说明。",
    ]);
  }
  database = Buffer.from(db.export());
  db.close();
});

async function setup(page: Page) {
  await page.route("**/*.cdb", (route) => route.fulfill({ body: database }));
  await page.route("**/*.conf", (route) =>
    route.fulfill({ body: "!system 1001 手牌\n!system 1002 怪兽区" }),
  );
  await page.route("**/test-release-v2.json", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route(/\/100000[1-4]\.(jpg|png|webp)(\?.*)?$/, (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 146"><rect width="100" height="146" fill="#9d7544"/><rect x="8" y="20" width="84" height="75" fill="#385164"/><rect x="8" y="103" width="84" height="35" fill="#e7d5ad"/></svg>',
    }),
  );
  await page.goto("/match");
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  await page.evaluate(async () => {
    const { initializeApp } = await import("/src/ui/Layout/utils.ts");
    await initializeApp();
    const { initUIContainer, getUIContainer } = await import(
      "/src/container/compat.ts"
    );
    const { matStore, cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    window.__sent = [];
    window.__closed = false;
    initUIContainer({
      isClosed: () => window.__closed,
      close: () => {
        window.__closed = true;
      },
      ws: {
        readyState: WebSocket.OPEN,
        send: (data: Uint8Array) => window.__sent.push([...data]),
      },
    });
    matStore.selfType = ygopro.StocTypeChange.SelfType.PLAYER1;
    const make = (
      uuid: string,
      sequence: number,
      controller: number,
      zone: number,
    ) => ({
      uuid,
      code: 0,
      meta: { id: 0, data: {}, text: {} },
      location: new ygopro.CardLocation({
        controller,
        zone,
        sequence,
        position: ygopro.CardPosition.FACEDOWN_ATTACK,
      }),
      idleInteractivities: [],
      counters: {},
      isToken: false,
      targeted: false,
      selectInfo: { selectable: false, selected: false },
      status: 0,
    });
    cardStore.inner = Array.from({ length: 4 }, (_, i) => [
      make(`hand-${i}`, i, 1, ygopro.CardZone.HAND),
      make(`deck-${i}`, i, 0, ygopro.CardZone.DECK),
    ]).flat();
    window.__startConfirm = (count: number, deckTop = false) => {
      const payload = new Uint8Array((deckTop ? 3 : 4) + count * 7);
      payload.set(deckTop ? [30, 0, count] : [31, 1, 0, count]);
      const view = new DataView(payload.buffer);
      for (let i = 0; i < count; i++) {
        const offset = (deckTop ? 3 : 4) + i * 7;
        view.setUint32(offset, 1000001 + i, true);
        payload.set(deckTop ? [0, 1, i] : [1, 2, i], offset + 4);
      }
      const wire = new Uint8Array(payload.length + 3);
      new DataView(wire.buffer).setUint16(0, payload.length + 1, true);
      wire[2] = 1;
      wire.set(payload, 3);
      window.__confirmDone = false;
      window.__confirmStartedAt = performance.now();
      void import("/src/service/onSocketMessage.ts")
        .then(({ default: handle }) =>
          handle(
            getUIContainer(),
            new MessageEvent("message", { data: wire.buffer }),
          ),
        )
        .then(() => {
          window.__confirmElapsed =
            performance.now() - window.__confirmStartedAt;
          window.__confirmDone = true;
        });
    };
    history.pushState({}, "", "/duel");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByTestId("duel-toolbar")).toBeVisible();
  await page.waitForTimeout(1100);
}

const card = (page: Page, uuid: string) =>
  page.locator(`[data-testid="duel-card"][data-card-uuid="${uuid}"]`);
const done = (page: Page) => page.evaluate(() => window.__confirmDone);

test("enabled animations ignore system reduced motion and reveal hands in order", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setup(page);
  const first = card(page, "hand-0");
  const second = card(page, "hand-1");
  const initial = (await first.getAttribute("style"))!;
  const initialTransform = await first.evaluate((element) => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform);
    return { angle: Math.atan2(matrix.b, matrix.a), y: matrix.f };
  });
  await page.evaluate(() => window.__startConfirm(2));
  await expect(first).toHaveAttribute("data-card-confirming", "true");
  await page.waitForTimeout(250);
  await expect(first).toHaveAttribute("data-card-confirming", "true");
  await expectCardFace(first, true);
  await expect(first.locator('[class*="focus_"]')).toHaveCSS("display", "none");
  await first.evaluate((element) => {
    window.__returnAngles = [];
    const sample = () => {
      window.__returnAngles.push(
        (Math.acos(
          Math.min(
            1,
            Math.max(
              -1,
              new DOMMatrix(
                getComputedStyle(
                  element.querySelector('[class*="img-wrap"]')!,
                ).transform,
              ).m33,
            ),
          ),
        ) *
          180) /
          Math.PI,
      );
      if (element.getAttribute("data-card-confirming") === "true")
        requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  const revealedTransform = await first.evaluate((element) => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform);
    return { angle: Math.atan2(matrix.b, matrix.a), y: matrix.f };
  });
  expect(revealedTransform.angle).toBeCloseTo(initialTransform.angle, 3);
  expect(revealedTransform.y - initialTransform.y).toBeGreaterThan(30);
  expect(revealedTransform.y - initialTransform.y).toBeLessThan(80);
  await expect(second).toHaveAttribute("data-card-confirming", "false");
  expect(await done(page)).toBe(false);
  await expect(second).toHaveAttribute("data-card-confirming", "true");
  await expect(first).toHaveAttribute("data-card-confirming", "false");
  await expect(first).toHaveAttribute("style", initial!);
  expect(
    await page.evaluate(() => Math.max(...window.__returnAngles)),
  ).toBeLessThan(1);
  await page.screenshot({ path: info.outputPath("hand-reveal.png") });
  await expect.poll(() => done(page)).toBe(true);
  await expectCardFace(second, true);
  expect(await page.evaluate(() => window.__confirmElapsed)).toBeGreaterThan(
    1100,
  );
  expect(await page.evaluate(() => window.__sent)).toEqual([]);
});

test("four cards wait for local confirmation without sending a response", async ({
  page,
}, info) => {
  await setup(page);
  await page.evaluate(() => window.__startConfirm(4));
  const modal = page.getByTestId("duel-confirm-cards-modal");
  await expect(modal).toBeVisible();
  await expect(page.getByTestId("duel-confirm-card")).toHaveCount(4);
  await page.waitForTimeout(1200);
  expect(await done(page)).toBe(false);
  await page.screenshot({ path: info.outputPath("confirm-cards.png") });
  await page.getByTestId("duel-confirm-card").first().click();
  await expect(page.getByTestId("duel-card-detail")).toBeVisible();
  await page.getByTestId("duel-confirm-cards-finish").click();
  await expect(modal).not.toBeVisible();
  await expect.poll(() => done(page)).toBe(true);
  for (let i = 0; i < 4; i++)
    await expectCardFace(card(page, `hand-${i}`), true);
  expect(await page.evaluate(() => window.__sent)).toEqual([]);
});

for (const mode of ["watch", "replay"]) {
  test(`${mode} reveals four cards automatically instead of requiring confirmation`, async ({
    page,
  }) => {
    await setup(page);
    await page.evaluate(async (mode) => {
      const { matStore, replayStore } = await import("/src/stores/index.ts");
      if (mode === "watch") matStore.selfType = 100;
      else replayStore.isReplay = true;
      window.__startConfirm(4);
    }, mode);
    await expect(card(page, "hand-0")).toHaveAttribute(
      "data-card-confirming",
      "true",
    );
    await expect(
      page.getByTestId("duel-confirm-cards-modal"),
    ).not.toBeVisible();
    await expect.poll(() => done(page)).toBe(true);
    expect(await page.evaluate(() => window.__confirmElapsed)).toBeGreaterThan(
      2300,
    );
    expect(await page.evaluate(() => window.__sent)).toEqual([]);
  });
}

test("disconnect cancels a reveal and a confirmation list without leaving pending waits", async ({
  page,
}) => {
  await setup(page);
  const first = card(page, "hand-0");
  const initial = (await first.getAttribute("style"))!;
  await page.evaluate(() => window.__startConfirm(2));
  await expect(first).toHaveAttribute("data-card-confirming", "true");
  await page.waitForTimeout(150);
  await page.evaluate(async () => {
    const { resetDuelDialogs } = await import("/src/stores/duelDialogs.ts");
    window.__closed = true;
    resetDuelDialogs(true);
  });
  await expect.poll(() => done(page)).toBe(true);
  await expect(first).toHaveAttribute("style", initial!);
  await expect(card(page, "hand-1")).toHaveAttribute(
    "data-card-confirming",
    "false",
  );
  await page.evaluate(() => {
    window.__closed = false;
    window.__startConfirm(4);
  });
  await expect(page.getByTestId("duel-confirm-cards-modal")).toBeVisible();
  await page.evaluate(async () => {
    const { resetDuelDialogs } = await import("/src/stores/duelDialogs.ts");
    window.__closed = true;
    resetDuelDialogs(true);
  });
  await expect.poll(() => done(page)).toBe(true);
  await expect(page.getByTestId("duel-confirm-cards-modal")).not.toBeVisible();
  expect(await page.evaluate(() => window.__sent)).toEqual([]);
});

test("backgrounding during a reveal ends the presentation and restores the card", async ({
  page,
}) => {
  await setup(page);
  const first = card(page, "hand-0");
  const initial = (await first.getAttribute("style"))!;
  await page.evaluate(() => window.__startConfirm(2));
  await expect(first).toHaveAttribute("data-card-confirming", "true");
  await page.waitForTimeout(150);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => done(page)).toBe(true);
  await expect(first).toHaveAttribute("style", initial!);
  expect(await page.evaluate(() => window.__confirmElapsed)).toBeLessThan(1000);
});

test("deck-top confirmations keep top-down order and disabled animations skip the hold", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    settingStore.saveAnimationConfig({ enabled: false });
  });
  await page.evaluate(() => window.__startConfirm(4, true));
  await expect.poll(() => done(page)).toBe(true);
  await expect(page.getByTestId("duel-confirm-cards-modal")).not.toBeVisible();
  await expect(card(page, "deck-3")).toHaveAttribute(
    "data-card-code",
    "1000001",
  );
  await expect(card(page, "deck-0")).toHaveAttribute(
    "data-card-code",
    "1000004",
  );
  expect(await page.evaluate(() => window.__confirmElapsed)).toBeLessThan(500);
  expect(
    await page.evaluate(async () => {
      const { historyStore } = await import("/src/stores/index.ts");
      return historyStore.historys.map(
        (entry) => entry.currentLocation.sequence,
      );
    }),
  ).toEqual([3, 2, 1, 0]);
});

test("disabling animations during a reveal completes the queue and restores the card", async ({
  page,
}) => {
  await setup(page);
  const first = card(page, "hand-0");
  const initial = (await first.getAttribute("style"))!;
  await page.evaluate(() => window.__startConfirm(2));
  await expect(first).toHaveAttribute("data-card-confirming", "true");
  await page.waitForTimeout(250);
  await page.evaluate(async () => {
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    settingStore.saveAnimationConfig({ enabled: false });
  });
  await expect.poll(() => done(page)).toBe(true);
  await expect(first).toHaveAttribute("style", initial!);
  expect(await page.evaluate(() => window.__confirmElapsed)).toBeLessThan(1000);
});

test("confirming a set monster preserves its position while showing its face", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const { callCardMove } = await import(
      "/src/ui/Duel/PlayMat/Card/index.tsx"
    );
    const target = cardStore.inner.find((card) => card.uuid === "hand-0");
    target.location.zone = ygopro.CardZone.MZONE;
    target.location.position = ygopro.CardPosition.FACEDOWN_DEFENSE;
    await callCardMove(target.uuid);
  });
  const target = card(page, "hand-0");
  const initial = await target.getAttribute("style");
  await page.evaluate(async () => {
    const { default: handle } = await import(
      "/src/service/duel/confirmCards.ts"
    );
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { ygopro } = await import("/src/api/index.ts");
    window.__confirmDone = false;
    void handle(getUIContainer(), {
      player: 1,
      cards: [
        {
          code: 1000001,
          controller: 1,
          location: ygopro.CardZone.MZONE,
          sequence: 0,
        },
      ],
    }).then(() => {
      window.__confirmDone = true;
    });
  });
  await expect(target).toHaveAttribute("data-card-confirming", "true");
  await expectCardFace(target, true);
  await expect(target).toHaveAttribute(
    "data-card-position",
    "FACEDOWN_DEFENSE",
  );
  await expect.poll(() => done(page)).toBe(true);
  await expect(target).toHaveAttribute("style", initial!);
});
