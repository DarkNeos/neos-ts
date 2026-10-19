import { expect, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

import {
  buildReplayRecord,
  pauseReplay,
  uploadReplay,
  writeReplayFixture,
} from "./helpers/replay";

let database: Buffer;
test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER, alias INTEGER DEFAULT 0); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT, str1 TEXT);",
  );
  for (const [id, name] of [
    [1000001, "原卡名"],
    [1000002, "现卡名"],
    [1000003, "墓地怪兽"],
  ] as const) {
    db.run("INSERT INTO datas VALUES (?, 65, 0)", [id]);
    db.run("INSERT INTO texts VALUES (?, ?, '原效果文本', '附加效果说明')", [
      id,
      name,
    ]);
  }
  database = Buffer.from(db.export());
  db.close();
});

async function setup(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route("**/ygopro-super-pre/data/version.txt", (route) =>
    route.fulfill({ body: "1792173550" }),
  );
  await page.route(/\.cdb(?:\?.*)?$/, (route) =>
    route.fulfill({ body: database }),
  );
  await page.route("**/*.conf", (route) =>
    route.fulfill({
      body: "!system 1020 战士族\n!system 1021 魔法师族\n!system 1045 幻想魔族\n!system 1014 光\n!system 1015 暗\n!system 1004 墓地\n!system 1001 手牌\n!system 100 选项说明",
    }),
  );
  await page.route(/\/test-release-v2\.json(?:\?.*)?$/, (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route(/\/100000[1-3]\.(webp|jpg)(\?.*)?$/, (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 146"><rect width="100" height="146" fill="#a48152"/></svg>',
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
    const { matStore, cardStore, historyStore } = await import(
      "/src/stores/index.ts"
    );
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    const { fetchCard, ygopro } = await import("/src/api/index.ts");
    const { genCard } = await import("/src/service/utils/genCard.ts");
    const { default: handle } = await import("/src/service/onSocketMessage.ts");
    initUIContainer({
      isClosed: () => false,
      close: () => {},
      ws: { readyState: WebSocket.OPEN, send: () => {} },
    });
    matStore.reset();
    historyStore.reset();
    matStore.selfType = 1;
    settingStore.saveAnimationConfig({ enabled: false });
    cardStore.inner = [
      ["source", 1000001, 0, ygopro.CardZone.MZONE, 0],
      ["target", 1000002, 1, ygopro.CardZone.MZONE, 1],
      ["grave", 1000003, 0, ygopro.CardZone.GRAVE, 0],
    ].map(([uuid, code, controller, zone, sequence]) =>
      genCard({
        uuid,
        code,
        meta: fetchCard(code),
        location: new ygopro.CardLocation({
          controller,
          zone,
          sequence,
          position: ygopro.CardPosition.FACEUP_ATTACK,
        }),
        counters: {},
        idleInteractivities: [],
        selectInfo: { selectable: false, selected: false },
        status: 0,
        isToken: false,
        targeted: false,
      }),
    );
    window.__duelHintSend = async (bytes: number[]) => {
      const packet = new Uint8Array(bytes.length + 3);
      new DataView(packet.buffer).setUint16(0, bytes.length + 1, true);
      packet[2] = 1;
      packet.set(bytes, 3);
      await handle(
        getUIContainer(),
        new MessageEvent("message", { data: packet.buffer }),
      );
    };
    history.pushState({}, "", "/duel");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByTestId("duel-toolbar")).toBeVisible();
}

const u32 = (value: number) => {
  const bytes = Buffer.alloc(4);
  bytes.writeUInt32LE(value >>> 0);
  return [...bytes];
};
const send = (page: Page, bytes: number[]) =>
  page.evaluate((bytes) => window.__duelHintSend(bytes), bytes);
const cardHint = (page: Page, type: number, value: number) =>
  send(page, [160, 0, 4, 0, 0, type, ...u32(value)]);
const playerHint = (page: Page, player: number, type: number, value: number) =>
  send(page, [165, player, type, ...u32(value)]);
const source = (page: Page) =>
  page.locator('[data-testid="duel-card"][data-card-uuid="source"]');
const chainMessage = (
  code = 1000001,
  player = 0,
  zone = 4,
  sequence = 0,
  index = 1,
) => [
  70,
  ...u32(code),
  player,
  zone,
  sequence,
  0,
  player,
  zone,
  sequence,
  ...u32(0),
  index,
];

test("card hints show counters and declarations, retain duplicate descriptions, and clear on movement", async ({
  page,
}) => {
  await setup(page);
  await cardHint(page, 1, 3);
  await expect(source(page).getByTestId("field-card-turn-counter")).toHaveText(
    "3",
  );
  await source(page).click();
  const detail = page.getByTestId("duel-card-detail");
  await expect(detail.getByTestId("card-current-hint")).toHaveText(
    "回合计数：3",
  );
  for (const [type, value, text] of [
    [2, 1000002, "宣言卡名：现卡名"],
    [3, 3, "宣言种族：战士族 / 魔法师族"],
    [4, 48, "宣言属性：光 / 暗"],
    [5, 7, "宣言数字：7"],
  ] as const) {
    await cardHint(page, type, value);
    await expect(detail.getByTestId("card-current-hint")).toHaveText(text);
  }
  await cardHint(page, 6, 1000001 * 16);
  await cardHint(page, 6, 1000001 * 16);
  await cardHint(page, 7, 1000001 * 16);
  await expect(detail.getByTestId("card-description-hint")).toHaveText(
    "附加效果说明",
  );
  await cardHint(page, 7, 1000001 * 16);
  await expect(detail.getByTestId("card-description-hint")).toHaveCount(0);
  await cardHint(page, 1, 0);
  await expect(detail.getByTestId("card-current-hint")).toHaveCount(0);
  await cardHint(page, 1, 4);
  await send(page, [50, ...u32(1000001), 0, 4, 0, 1, 0, 16, 1, 1, ...u32(0)]);
  await expect(detail.getByTestId("card-current-hint")).toHaveCount(0);
});

test("player hints update each side and enforce and release grave inspection restrictions", async ({
  page,
}) => {
  await setup(page);
  await playerHint(page, 1, 6, 1000001 * 16);
  await playerHint(page, 1, 6, 1000001 * 16);
  await playerHint(page, 1, 7, 1000001 * 16);
  const opponent = page.locator(
    '[data-testid="duel-player-life"][data-player="op"]',
  );
  await expect(opponent.getByTestId("duel-player-hint")).toHaveText(
    "附加效果说明",
  );
  await playerHint(page, 1, 7, 1000001 * 16);
  await expect(opponent.getByTestId("duel-player-hint")).toHaveCount(0);
  await page.evaluate(async () => {
    const { ygopro } = await import("/src/api/index.ts");
    const { displayCardListModal } = await import(
      "/src/ui/Duel/Message/CardListModal/index.tsx"
    );
    displayCardListModal({
      isZone: true,
      zone: ygopro.CardZone.GRAVE,
      controller: 0,
    });
  });
  const list = page.getByTestId("duel-card-list-drawer");
  await expect(list.getByTestId("duel-card-list-entry")).toHaveCount(1);
  await playerHint(page, 0, 6, 38723936);
  await expect(list.getByTestId("grave-inspection-blocked")).toBeVisible();
  await expect(list.getByTestId("duel-card-list-entry")).toHaveCount(0);
  await playerHint(page, 0, 7, 38723936);
  await expect(list.getByTestId("duel-card-list-entry")).toHaveCount(1);
});

test("declaration results, effect choices, cards and zones are preserved in the history", async ({
  page,
}) => {
  await setup(page);
  for (const [type, value] of [
    [6, 3],
    [7, 48],
    [8, 1000002],
    [9, 0],
    [4, 100],
    [11, 0x10001],
    [10, 1000003],
  ])
    await send(page, [2, type, 1, ...u32(value)]);
  await page.evaluate(async () => {
    const { displayActionHistory } = await import(
      "/src/ui/Duel/Message/ActionHistory/index.tsx"
    );
    displayActionHistory();
  });
  const notes = page.getByTestId("duel-history-hint");
  await expect(notes).toHaveCount(7);
  await expect(notes.nth(0)).toContainText("宣言种族：战士族 / 魔法师族");
  await expect(notes.nth(1)).toContainText("宣言属性：光 / 暗");
  await expect(notes.nth(2)).toContainText("宣言卡名：现卡名");
  await expect(notes.nth(3)).toContainText("宣言数字：0");
  await expect(notes.nth(4)).toContainText("选择效果：选项说明");
  await expect(notes.nth(5)).toContainText("对方怪兽区 1、我方怪兽区 1");
  await expect(notes.nth(6)).toContainText("展示卡片：墓地怪兽");
  await expect(page.getByTestId("duel-card-name")).toContainText("墓地怪兽");
});

test("list names and proper summon status follow live query data", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const { displayCardListModal } = await import(
      "/src/ui/Duel/Message/CardListModal/index.tsx"
    );
    cardStore.inner[2].meta.data.alias = 1000002;
    cardStore.inner[2].status = 8;
    displayCardListModal({
      isZone: true,
      zone: ygopro.CardZone.GRAVE,
      controller: 0,
    });
  });
  const entry = page.getByTestId("duel-card-list-entry");
  await expect(entry).toContainText("墓地怪兽");
  await expect(entry).toContainText("(现卡名)");
  await expect(entry.getByTestId("card-summon-status")).toHaveText(
    "已正规召唤",
  );
  await entry.click();
  await expect(page.getByTestId("duel-card-name")).toContainText("墓地怪兽");
  await expect(page.getByTestId("duel-card-name")).toContainText("(现卡名)");
  const query = [12, 0, 0, 0, ...u32(0x80000), ...u32(0)];
  await send(page, [7, 0, 16, 0, ...query]);
  await expect(entry.getByTestId("card-summon-status")).toHaveText(
    "未正规登场",
  );
});

test("chain targets retain separate numbers and highlight both ends, with distinct negation results", async ({
  page,
}) => {
  await setup(page);
  await send(page, chainMessage());
  await send(page, [83, 1, 1, 4, 1, 0]);
  await send(page, [83, 1, 1, 4, 1, 0]);
  await send(page, chainMessage(1000001, 0, 4, 0, 2));
  await send(page, [83, 1, 1, 4, 1, 0]);
  const target = page.locator(
    '[data-testid="duel-card"][data-card-uuid="target"]',
  );
  await expect(target.getByTestId("field-card-chain-relation")).toHaveCount(2);
  await source(page).hover();
  await expect(source(page)).toHaveAttribute("data-relation-active", "true");
  await expect(target).toHaveAttribute("data-relation-active", "true");
  await expect(
    page.locator('[data-testid="field-relation"][data-kind="chain"]'),
  ).toHaveCount(2);
  await send(page, [75, 1]);
  await send(page, [76, 2]);
  const chains = page.getByTestId("duel-chain-card");
  await expect(chains.nth(0)).toContainText("发动无效");
  await expect(chains.nth(1)).toContainText("效果无效");
  await send(page, [73, 2]);
  await expect(chains.nth(1)).toContainText("效果无效");
  await send(page, [74]);
  await expect(page.getByTestId("duel-chain-card")).toHaveCount(0);
  await expect(target.getByTestId("field-card-chain-relation")).toHaveCount(0);
});

test("off-field activations identify facedown targets without revealing their identity, and set shuffles clear bindings", async ({
  page,
}) => {
  await setup(page);
  await send(page, [50, ...u32(1000001), 0, 4, 0, 1, 0, 16, 1, 1, ...u32(0)]);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const card = cardStore.inner.find((card) => card.uuid === "target");
    card.location.position = ygopro.CardPosition.FACEDOWN_DEFENSE;
    card.code = 0;
    card.meta = { id: 0, data: {}, text: {} };
  });
  await send(page, chainMessage(1000001, 0, 16, 1));
  await send(page, [83, 1, 1, 4, 1, 0]);
  const target = page.locator(
    '[data-testid="duel-card"][data-card-uuid="target"]',
  );
  await expect(target.getByTestId("field-card-chain-relation")).toHaveAttribute(
    "title",
    "连锁 1 对象",
  );
  await expect(target).toHaveAttribute("data-card-code", "0");
  await source(page).hover();
  await expect(target).toHaveAttribute("data-relation-active", "true");
  await expect(page.getByTestId("field-relation")).toHaveCount(0);
  await send(page, [36, 4, 1, 1, 4, 1, 0, 0, 0, 0, 0]);
  await expect(target.getByTestId("field-card-chain-relation")).toHaveCount(0);
  await expect(target).toHaveAttribute("data-relation-active", "false");
  await expect(page.getByTestId("duel-chain-card")).toHaveCount(1);
});

test("chain identity follows movement and control changes, and hand, extra and deck shuffles remove hints", async ({
  page,
}) => {
  await setup(page);
  await send(page, chainMessage());
  await send(page, [83, 1, 1, 4, 1, 0]);
  await send(page, [50, ...u32(1000002), 1, 4, 1, 1, 0, 4, 2, 1, ...u32(0)]);
  const target = page.locator(
    '[data-testid="duel-card"][data-card-uuid="target"]',
  );
  await expect(target.getByTestId("field-card-chain-relation")).toHaveAttribute(
    "data-relation-number",
    "1",
  );
  await expect(target).toHaveAttribute("data-card-controller", "0");
  for (const [zone, command] of [
    [2, 33],
    [64, 39],
    [1, 32],
  ]) {
    await send(page, [74]);
    await page.evaluate(async (zone) => {
      const { cardStore } = await import("/src/stores/index.ts");
      const { ygopro } = await import("/src/api/index.ts");
      const card = cardStore.inner.find((card) => card.uuid === "source");
      card.location.zone =
        zone === 2
          ? ygopro.CardZone.HAND
          : zone === 64
          ? ygopro.CardZone.EXTRA
          : ygopro.CardZone.DECK;
      card.location.sequence = 0;
      card.location.position = ygopro.CardPosition.FACEDOWN_ATTACK;
    }, zone);
    await send(page, [160, 0, zone, 0, 0, 1, ...u32(3)]);
    await send(page, [160, 0, zone, 0, 0, 6, ...u32(1000001 * 16)]);
    await send(page, chainMessage(1000001, 0, zone));
    await send(page, [83, 1, 0, zone, 0, 0]);
    await send(
      page,
      zone === 1 ? [command, 0] : [command, 0, 1, ...u32(1000001)],
    );
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const { cardStore, matStore } = await import("/src/stores/index.ts");
          const card = cardStore.inner.find((card) => card.uuid === "source");
          return {
            hint: card.hint ?? null,
            descriptions: card.descriptionHints,
            source: matStore.chainCards[0].cardUuid ?? null,
            targets: matStore.chainCards[0].targets,
          };
        }),
      )
      .toEqual({ hint: null, descriptions: {}, source: null, targets: [] });
  }
});

test("zone hints use the declaring player's perspective and deduplicate shared extra zones", async ({
  page,
}) => {
  await setup(page);
  await send(page, [2, 11, 1, ...u32(1)]);
  await expect(
    page.locator(
      '[data-testid="duel-zone"][data-zone="MZONE"][data-controller="1"][data-sequence="0"]',
    ),
  ).toHaveAttribute("data-hinted", "true");
  await expect(
    page.locator(
      '[data-testid="duel-zone"][data-zone="MZONE"][data-controller="0"][data-sequence="0"]',
    ),
  ).toHaveAttribute("data-hinted", "false");
  await send(page, [2, 11, 0, ...u32(0x400020)]);
  await page.evaluate(async () => {
    const { displayActionHistory } = await import(
      "/src/ui/Duel/Message/ActionHistory/index.tsx"
    );
    displayActionHistory();
  });
  await expect(page.getByTestId("duel-history-hint").last()).toContainText(
    "选择区域：我方额外怪兽区 1",
  );
  await expect(page.getByTestId("duel-history-hint").last()).not.toContainText(
    "对方额外怪兽区",
  );
  await expect(
    page.locator('[data-testid="duel-zone"][data-hinted="true"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('[data-testid="duel-zone"][data-hinted="true"]'),
  ).toHaveCount(0);
});

test("auxiliary hints preserve the active decision and clock", async ({
  page,
}) => {
  await setup(page);
  await send(page, [11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1]);
  await page.evaluate(async () => {
    const { matStore } = await import("/src/stores/index.ts");
    matStore.timeLimits.set(0, 180);
  });
  await cardHint(page, 1, 3);
  await playerHint(page, 0, 6, 1000001 * 16);
  await send(page, [2, 9, 1, ...u32(7)]);
  await send(page, [75, 99]);
  await expect(
    page
      .getByTestId("duel-player-timer")
      .filter({ has: page.locator('[aria-label="我方剩余时间"]') }),
  ).toHaveAttribute("data-active", "true");
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { matStore } = await import("/src/stores/index.ts");
        return matStore.phase.command?.type;
      }),
    )
    .toBe("idle");
});

test("rebuilding or leaving a duel clears auxiliary state", async ({
  page,
}) => {
  await setup(page);
  await cardHint(page, 1, 3);
  await playerHint(page, 0, 6, 1000001 * 16);
  await send(page, chainMessage());
  await page.evaluate(async () => {
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: reload } = await import(
      "/src/service/duel/reloadField.ts"
    );
    reload(getUIContainer(), { actions: [] });
  });
  await expect(page.getByTestId("field-card-turn-counter")).toHaveCount(0);
  await expect(page.getByTestId("duel-player-hint")).toHaveCount(0);
  await expect(page.getByTestId("duel-chain-card")).toHaveCount(0);
});

test("replay seeking rebuilds hint reference counts, counters and negated chain targets", async ({
  page,
}, info) => {
  await setup(page);
  const start = [4, 0, ...u32(8000), ...u32(8000), 3, 0, 0, 0, 3, 0, 0, 0];
  const records = [
    start,
    [50, ...u32(1000001), 0, 1, 0, 2, 0, 4, 0, 1, ...u32(0)],
    [50, ...u32(1000002), 1, 1, 0, 2, 1, 4, 1, 1, ...u32(0)],
    [160, 0, 4, 0, 0, 1, ...u32(3)],
    [160, 0, 4, 0, 0, 6, ...u32(1000001 * 16)],
    [165, 1, 6, ...u32(1000001 * 16)],
    chainMessage(),
    [83, 1, 1, 4, 1, 0],
    [76, 1],
    [40, 0],
    [160, 0, 4, 0, 0, 1, ...u32(4)],
    [165, 1, 7, ...u32(1000001 * 16)],
    [74],
    [40, 1],
    [5, 0, 0],
  ];
  const replay = Uint8Array.from(
    records.flatMap(([type, ...payload]) => [
      ...buildReplayRecord(type, Uint8Array.from(payload)),
    ]),
  );
  const file = await writeReplayFixture(info, "duel-hints.yrp3d", replay);
  await uploadReplay(page, file);
  await pauseReplay(page);
  const seek = (index: number) =>
    page.evaluate(async (index) => {
      const { replayStore } = await import("/src/stores/index.ts");
      return replayStore.seek(index);
    }, index);
  const verify = async () => {
    await expect(page.getByTestId("field-card-turn-counter")).toHaveText("3");
    await expect(page.getByTestId("duel-player-hint")).toHaveText(
      "附加效果说明",
    );
    await expect(page.getByTestId("duel-chain-card")).toContainText("效果无效");
    await expect(
      page.locator(
        '[data-testid="field-card-chain-relation"][data-role="target"]',
      ),
    ).toHaveAttribute("data-relation-number", "1");
  };
  expect(await seek(9)).toBe(true);
  await verify();
  await page.getByTestId("duel-chain-card").click();
  await expect(page.getByTestId("card-description-hint")).toHaveText(
    "附加效果说明",
  );
  expect(await seek(13)).toBe(true);
  await expect(page.getByTestId("field-card-turn-counter")).toHaveText("4");
  await expect(page.getByTestId("duel-player-hint")).toHaveCount(0);
  await expect(page.getByTestId("duel-chain-card")).toHaveCount(0);
  expect(await seek(9)).toBe(true);
  await verify();
  await page.getByTestId("replay-swap").click();
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-seeking",
    "false",
  );
  await expect(
    page
      .locator('[data-testid="duel-player-life"][data-player="me"]')
      .getByTestId("duel-player-hint"),
  ).toHaveText("附加效果说明");
  await page.goto("/match");
  await expect(page.getByTestId("duel-player-hint")).toHaveCount(0);
});
