import { expect, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

import { expectCardFace, expectCardDepth } from "./helpers/card-geometry";

let database: Buffer;
test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER, alias INTEGER DEFAULT 0); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
  );
  // 普通、融合、同调、超量、连接、普通灵摆和仪式怪兽。
  for (const [i, type] of [
    1, 0x41, 0x2001, 0x800001, 0x4000001, 0x1000001, 0x81,
  ].entries()) {
    db.run("INSERT INTO datas (id, type) VALUES (?, ?)", [1000001 + i, type]);
    db.run("INSERT INTO texts VALUES (?, ?, '')", [
      1000001 + i,
      `卡组测试卡 ${i}`,
    ]);
  }
  database = Buffer.from(db.export());
  db.close();
});

async function setup(page: Page) {
  await page.route("**/*.cdb", (route) => route.fulfill({ body: database }));
  await page.route("**/*.conf", (route) =>
    route.fulfill({
      body: "!system 1000 卡组\n!system 1001 手牌\n!system 1004 墓地\n!system 1006 额外卡组",
    }),
  );
  await page.route("**/test-release-v2.json", (route) =>
    route.fulfill({ json: [] }),
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
    const { ygopro, fetchCard } = await import("/src/api/index.ts");
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
    matStore.selfType = 1;
    window.__makeCard = (
      uuid: string,
      controller: number,
      zone: number,
      sequence: number,
      code = 1000001,
      position = ygopro.CardPosition.FACEDOWN_ATTACK,
    ) => {
      const meta = fetchCard(code);
      return {
        uuid,
        code,
        meta,
        originalData: { ...meta.data },
        location: new ygopro.CardLocation({
          controller,
          zone,
          sequence,
          position,
        }),
        idleInteractivities: [],
        counters: {},
        isToken: false,
        targeted: false,
        selectInfo: { selectable: false, selected: false },
        status: 0,
      };
    };
    cardStore.inner = [0, 1].flatMap((player) => [
      ...[0, 1, 2].map((i) =>
        window.__makeCard(
          `deck-${player}-${i}`,
          player,
          ygopro.CardZone.DECK,
          i,
        ),
      ),
      window.__makeCard(
        `extra-${player}-down`,
        player,
        ygopro.CardZone.EXTRA,
        0,
        1000002,
      ),
      window.__makeCard(
        `extra-${player}-up`,
        player,
        ygopro.CardZone.EXTRA,
        1,
        1000006,
        ygopro.CardPosition.FACEUP_ATTACK,
      ),
    ]);
    window.__wire = (payload: number[]) => {
      const wire = new Uint8Array(payload.length + 3);
      new DataView(wire.buffer).setUint16(0, payload.length + 1, true);
      wire[2] = 1;
      wire.set(payload, 3);
      window.__operationDone = false;
      return import("/src/service/onSocketMessage.ts")
        .then(({ default: handle }) =>
          handle(
            getUIContainer(),
            new MessageEvent("message", { data: wire.buffer }),
          ),
        )
        .then(() => {
          window.__operationDone = true;
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
const done = (page: Page) => page.evaluate(() => window.__operationDone);
const wire = (page: Page, payload: number[]) =>
  page.evaluate((payload) => {
    void window.__wire(payload);
  }, payload);
const uint32 = (value: number) => [
  ...new Uint8Array(new Uint32Array([value]).buffer),
];

test("face-up Pendulum cards stay on top when the Extra Deck changes", async ({
  page,
}) => {
  await setup(page);
  for (const controller of [0, 1]) {
    // 新的里侧卡插入额外卡组时，已有表侧卡的序号和显示层级都应更新。
    await wire(page, [
      50,
      ...uint32(1000002),
      controller,
      0x01,
      2,
      2,
      controller,
      0x40,
      1,
      2,
      ...uint32(0),
    ]);
    await expect.poll(() => done(page)).toBe(true);
    const faceup = card(page, `extra-${controller}-up`);
    await expect(faceup).toHaveAttribute("data-card-sequence", "2");
    await expectCardFace(faceup, true);
    await expectCardDepth(faceup, 2);
    await expect(faceup).toHaveCSS("z-index", "2");
    await expectCardDepth(card(page, `deck-${controller}-2`), 1);

    // 表侧卡离开后显示下一张；再次表侧返回时仍显示在里侧卡上方。
    await wire(page, [
      50,
      ...uint32(1000006),
      controller,
      0x40,
      2,
      1,
      controller,
      0x04,
      0,
      1,
      ...uint32(0),
    ]);
    await expect.poll(() => done(page)).toBe(true);
    await expectCardFace(card(page, `deck-${controller}-2`), false);
    await wire(page, [
      50,
      ...uint32(1000006),
      controller,
      0x04,
      0,
      1,
      controller,
      0x40,
      0,
      1,
      ...uint32(0),
    ]);
    await expect.poll(() => done(page)).toBe(true);
    await expect(faceup).toHaveAttribute("data-card-sequence", "0");
    await expectCardFace(faceup, true);
    await expectCardDepth(faceup, 2);
    await expect(faceup).toHaveCSS("z-index", "2");
    expect(
      await faceup.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return document
          .elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
          ?.closest<HTMLElement>('[data-testid="duel-card"]')?.dataset.cardUuid;
      }),
    ).toBe(`extra-${controller}-up`);
  }
});

test("field reload preserves face-up Extra Deck cards for both players", async ({
  page,
}) => {
  await setup(page);
  const player = (faceup: number) => [
    ...uint32(8000),
    ...Array(15).fill(0),
    0,
    0,
    0,
    0,
    3,
    faceup,
  ];
  await wire(page, [162, 5, ...player(1), ...player(2), 0]);
  await expect.poll(() => done(page)).toBe(true);
  for (const [controller, faceup] of [
    [0, 1],
    [1, 2],
  ]) {
    for (let sequence = 0; sequence < 3; sequence++) {
      const target = page.locator(
        `[data-testid="duel-card"][data-card-controller="${controller}"][data-card-zone="EXTRA"][data-card-sequence="${sequence}"]`,
      );
      await expect(target).toHaveAttribute(
        "data-card-position",
        sequence >= 3 - faceup ? "FACEUP_ATTACK" : "FACEDOWN_ATTACK",
      );
      await expectCardFace(target, sequence >= 3 - faceup);
    }
  }
});

for (const message of [32, 34]) {
  test(`${message} shuffles only the addressed deck and restores its layout`, async ({
    page,
  }) => {
    await setup(page);
    const first = card(page, "deck-0-0");
    const initial = await first.getAttribute("style");
    await wire(page, [message, 0]);
    await expect(first).toHaveAttribute("data-card-shuffling", "true");
    await expect(first).toHaveAttribute("data-card-code", "0");
    await expect(card(page, "deck-1-0")).toHaveAttribute(
      "data-card-code",
      "1000001",
    );
    await expect(card(page, "extra-0-down")).toHaveAttribute(
      "data-card-code",
      "1000002",
    );
    await expect
      .poll(async () => (await first.getAttribute("style")) !== initial)
      .toBe(true);
    await expect.poll(() => done(page)).toBe(true);
    await expect(first).toHaveAttribute("data-card-shuffling", "false");
    await expect(first).toHaveAttribute("style", initial!);
    expect(
      await page.evaluate(async () => {
        const { cardStore } = await import("/src/stores/index.ts");
        return cardStore
          .at(0, 0)
          .map((c) => [c.meta.id, c.originalData ?? null]);
      }),
    ).toEqual([
      [0, null],
      [0, null],
      [0, null],
    ]);
  });
}

test("REVERSE_DECK toggles both decks, leaves EXTRA alone and resets with duel state", async ({
  page,
}) => {
  await setup(page);
  for (const reversed of [true, false]) {
    await wire(page, [37]);
    await expect.poll(() => done(page)).toBe(true);
    expect(
      await page.evaluate(
        async () =>
          (await import("/src/stores/index.ts")).matStore.deckReserved,
      ),
    ).toBe(reversed);
    for (const controller of [0, 1]) {
      await expectCardFace(card(page, `deck-${controller}-2`), reversed);
      await expectCardFace(card(page, `extra-${controller}-down`), false);
      await expectCardFace(card(page, `extra-${controller}-up`), true);
    }
  }
  await wire(page, [37]);
  await expect.poll(() => done(page)).toBe(true);
  expect(
    await page.evaluate(async () => {
      const { matStore } = await import("/src/stores/index.ts");
      matStore.reset();
      return matStore.deckReserved;
    }),
  ).toBe(false);
});

test("DECK_TOP uses an offset from the top, masks the faceup bit and reveals the addressed card", async ({
  page,
}) => {
  await setup(page);
  const target = card(page, "deck-1-1");
  await wire(page, [38, 1, 1, ...uint32(0x80000000 + 1000002)]);
  await expect(target).toHaveAttribute("data-card-confirming", "true");
  await expect(target).toHaveAttribute("data-card-code", "1000002");
  await expect.poll(() => done(page)).toBe(true);
  await expectCardFace(target, true);
  await expect(card(page, "deck-1-2")).toHaveAttribute(
    "data-card-code",
    "1000001",
  );
  await wire(page, [38, 1, 0, ...uint32(1000003)]);
  await expect(card(page, "deck-1-2")).toHaveAttribute(
    "data-card-confirming",
    "true",
  );
  await expect.poll(() => done(page)).toBe(true);
  await expectCardFace(card(page, "deck-1-2"), false);
  await wire(page, [38, 1, 99, ...uint32(1000004)]);
  await expect.poll(() => done(page)).toBe(true);
  expect(
    await page.evaluate(async () => {
      const { historyStore } = await import("/src/stores/index.ts");
      return historyStore.historys.map((h) => [
        h.card,
        h.currentLocation.sequence,
      ]);
    }),
  ).toEqual([
    [1000002, 1],
    [1000003, 2],
  ]);
  expect(await page.evaluate(() => window.__sent)).toEqual([]);
});

test("deck presentation stops on disconnect and is skipped when animations are disabled", async ({
  page,
}) => {
  await setup(page);
  const first = card(page, "deck-0-0");
  const initial = await first.getAttribute("style");
  await wire(page, [34, 0]);
  await expect(first).toHaveAttribute("data-card-shuffling", "true");
  await page.evaluate(async () => {
    window.__closed = true;
    (await import("/src/stores/duelDialogs.ts")).resetDuelDialogs(true);
  });
  await expect.poll(() => done(page)).toBe(true);
  await expect(first).toHaveAttribute("style", initial!);
  await page.evaluate(async () => {
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    settingStore.saveAnimationConfig({ enabled: false });
  });
  await page.evaluate(() => {
    window.__closed = false;
  });
  await wire(page, [34, 0]);
  await expect.poll(() => done(page)).toBe(true);
  await expect(first).toHaveAttribute("style", initial!);
});

test("grave/deck exchange returns extra monsters to EXTRA with continuous sequences", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    cardStore.inner.push(
      ...Array.from({ length: 7 }, (_, i) =>
        window.__makeCard(`grave-${i}`, 0, 4, i, 1000001 + i, 0),
      ),
    );
    // 离场恢复原始类型后再判断归属，不能按当前被效果修改的类型判断。
    cardStore.at(4, 0, 1).meta.data.type = 1;
  });
  await expect(card(page, "grave-6")).toBeVisible();
  await wire(page, [35, 0]);
  await expect.poll(() => done(page)).toBe(true);
  expect(
    await page.evaluate(async () => {
      const { cardStore } = await import("/src/stores/index.ts");
      return [0, 4, 6].map((zone) =>
        cardStore
          .at(zone, 0)
          .slice()
          .sort((a, b) => a.location.sequence - b.location.sequence)
          .map((c) => [c.uuid, c.location.sequence, c.location.position]),
      );
    }),
  ).toEqual([
    [
      ["grave-0", 0, 1],
      ["grave-5", 1, 1],
      ["grave-6", 2, 1],
    ],
    [
      ["deck-0-0", 0, 0],
      ["deck-0-1", 1, 0],
      ["deck-0-2", 2, 0],
    ],
    [
      ["extra-0-down", 0, 1],
      ["grave-1", 1, 1],
      ["grave-2", 2, 1],
      ["grave-3", 3, 1],
      ["grave-4", 4, 1],
      ["extra-0-up", 5, 0],
    ],
  ]);
  await expect(card(page, "grave-1")).toHaveAttribute(
    "data-card-details-visible",
    "false",
  );
  await expect(
    card(page, "grave-1").locator('[class*="img-wrap"]'),
  ).toHaveCount(0);
  await expectCardFace(card(page, "extra-0-up"), true);
  await expect(card(page, "deck-1-2")).toHaveAttribute(
    "data-card-sequence",
    "2",
  );
  await expect(card(page, "deck-1-2")).toHaveAttribute(
    "data-card-zone",
    "DECK",
  );
});

function selection(
  min: number,
  max: number,
  cards: number[][],
  cancelable = true,
) {
  return [
    15,
    0,
    +cancelable,
    min,
    max,
    cards.length,
    ...cards.flatMap(([code, controller, zone, sequence]) => [
      ...uint32(code),
      controller,
      zone,
      sequence,
      2,
    ]),
  ];
}

test("noncancelable selection auto responds for insufficient candidates and equivalent deck cards", async ({
  page,
}) => {
  await setup(page);
  const same = [0, 1, 2].map((i) => [1000001, 0, 1, i]);
  for (const [payload, response] of [
    [selection(2, 3, same.slice(0, 1), false), [1, 0]],
    [selection(2, 2, same.slice(0, 2), false), [2, 0, 1]],
    [selection(2, 2, same, false), [2, 0, 1]],
    [selection(1, 1, same, false), [1, 0]],
    [selection(1, 1, [], false), [0]],
  ]) {
    await page.evaluate(() => {
      window.__sent = [];
    });
    await wire(page, payload as number[]);
    await expect.poll(() => done(page)).toBe(true);
    expect(
      await page.evaluate(() => window.__sent.map((p) => p.slice(3))),
    ).toEqual([response]);
    await expect(
      page.locator('[data-testid="duel-select-cards-modal"]:visible'),
    ).toHaveCount(0);
  }
});

test("cancelable selection still asks with forced or equivalent deck candidates", async ({
  page,
}) => {
  await setup(page);
  const same = [0, 1, 2].map((i) => [1000001, 0, 1, i]);
  for (const cards of [same.slice(0, 1), same.slice(0, 2), same, []]) {
    await page.evaluate(() => {
      window.__sent = [];
    });
    await wire(page, selection(2, 2, cards));
    const modal = page.locator(
      '[data-testid="duel-select-cards-modal"]:visible',
    );
    await expect(modal).toBeVisible();
    expect(await page.evaluate(() => window.__sent)).toEqual([]);
    await page
      .locator('[data-testid="duel-select-card-cancel"]:visible')
      .click();
    await expect
      .poll(() => page.evaluate(() => window.__sent))
      .toEqual([[5, 0, 1, 255, 255, 255, 255]]);
    await expect(modal).not.toBeVisible();
  }
});

test("ordinary selection still asks when candidates differ in code, controller, location or quantity", async ({
  page,
}) => {
  await setup(page);
  for (const [max, cards] of [
    [
      1,
      [
        [1000001, 0, 1, 0],
        [1000002, 0, 1, 1],
      ],
    ],
    [
      1,
      [
        [1000001, 0, 1, 0],
        [1000001, 1, 1, 1],
      ],
    ],
    [
      1,
      [
        [1000001, 0, 1, 0],
        [1000001, 0, 64, 0],
      ],
    ],
    [
      1,
      [
        [0, 0, 1, 0],
        [0, 0, 1, 1],
      ],
    ],
    [
      1,
      [
        [1000001, 0, 129, 0],
        [1000001, 0, 129, 1],
      ],
    ],
    [
      2,
      [
        [1000001, 0, 1, 0],
        [1000001, 0, 1, 1],
      ],
    ],
  ] as [number, number[][]][]) {
    await page.evaluate(() => {
      window.__sent = [];
    });
    await wire(page, selection(1, max, cards));
    const modal = page.locator(
      '[data-testid="duel-select-cards-modal"]:visible',
    );
    await expect(modal).toBeVisible();
    expect(await page.evaluate(() => window.__sent)).toEqual([]);
    await page
      .locator('[data-testid="duel-select-card-cancel"]:visible')
      .click();
    await expect.poll(() => done(page)).toBe(true);
    await expect(modal).not.toBeVisible();
  }
});

test("replay advancement stops at deck operations", async ({ page }) => {
  await setup(page);
  await page.evaluate(async () => {
    const { replayStore } = await import("/src/stores/index.ts");
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    settingStore.saveAnimationConfig({ enabled: false });
    replayStore.beginReplay();
    replayStore.pause();
    void window.__wire([37]);
  });
  await expect
    .poll(() =>
      page.evaluate(
        async () => (await import("/src/stores/index.ts")).replayStore.waiting,
      ),
    )
    .toBe(true);
  await page.evaluate(async () =>
    (await import("/src/stores/index.ts")).replayStore.advanceToNextKey(),
  );
  await expect.poll(() => done(page)).toBe(true);
  await wire(page, [34, 0]);
  await expect
    .poll(() =>
      page.evaluate(
        async () => (await import("/src/stores/index.ts")).replayStore.waiting,
      ),
    )
    .toBe(true);
  expect(await done(page)).toBe(false);
  await page.evaluate(async () =>
    (await import("/src/stores/index.ts")).replayStore.advanceToNextKey(),
  );
  await expect.poll(() => done(page)).toBe(true);
});
