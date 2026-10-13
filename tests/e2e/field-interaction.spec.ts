import { expect, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

let database: Buffer;
test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER, alias INTEGER DEFAULT 0); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
  );
  for (const [id, alias, name, desc] of [
    [1000001, 0, "原卡名", "原卡片效果文本"],
    [1000002, 0, "变更后卡名", "另一张卡的效果文本"],
    [1000003, 1000001, "原卡名", "异画卡片效果文本"],
  ] as const) {
    db.run("INSERT INTO datas VALUES (?, 1, ?)", [id, alias]);
    db.run("INSERT INTO texts VALUES (?, ?, ?)", [id, name, desc]);
  }
  database = Buffer.from(db.export());
  db.close();
});
async function setup(page: Page) {
  page.on("pageerror", (error) => console.log("Browser error:", error.stack));
  await page.route("**/*.cdb", (route) => route.fulfill({ body: database }));
  await page.route("**/*.conf", (route) =>
    route.fulfill({
      body: "!system 1211 确认\n!system 1295 取消\n!system 1001 手牌\n!system 1002 怪兽区\n!system 1004 墓地\n",
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
    const { ygopro } = await import("/src/api/index.ts");
    window.__sent = [];
    initUIContainer({
      isClosed: () => false,
      close: () => {},
      ws: {
        readyState: WebSocket.OPEN,
        send: (data) => window.__sent.push([...data]),
      },
    });
    matStore.selfType = 1;
    matStore.currentPlayer = 0;
    const make = (
      uuid,
      sequence,
      controller = 0,
      zone = ygopro.CardZone.MZONE,
    ) => ({
      uuid,
      code: 46986414,
      meta: {
        id: 46986414,
        data: {
          type: 1,
          level: 4,
          atk: 1800,
          def: 1000,
          attribute: 1,
          race: 1,
        },
        text: { name: uuid },
      },
      originalData: {
        type: 1,
        level: 4,
        atk: 1800,
        def: 1000,
        attribute: 1,
        race: 1,
      },
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
    });
    window.__make = make;
    cardStore.inner = [
      make("a", 0),
      make("b", 1),
      make("c", 2),
      make("d", 3),
      make("e", 4),
      make("op", 2, 1),
    ];
    window.__choose = async (kind, options) => {
      const { resetDuelDialogs } = await import("/src/stores/duelDialogs.ts");
      resetDuelDialogs();
      window.__sent = [];
      const infos = (ids) =>
        ids.map((id, index) => {
          const card = cardStore.inner.find((c) => c.uuid === id);
          return {
            code: card.code,
            location: card.location,
            response: index,
            ...(options.values?.[index] ?? {}),
          };
        });
      const cards = infos(options.ids);
      const base = { min: 1, max: 1, cancelable: true, ...options };
      if (kind === "card") {
        const { default: handler } = await import(
          "/src/service/duel/selectCard.ts"
        );
        void handler(getUIContainer(), { ...base, cards });
      } else if (kind === "tribute") {
        const { default: handler } = await import(
          "/src/service/duel/selectTribute.ts"
        );
        void handler(getUIContainer(), { ...base, selectable_cards: cards });
      } else if (kind === "sum") {
        const { default: handler } = await import(
          "/src/service/duel/selectSum.ts"
        );
        const must = (options.must ?? []).map((id, response) => ({
          code: cardStore.inner.find((c) => c.uuid === id).code,
          location: cardStore.inner.find((c) => c.uuid === id).location,
          level1: 1,
          level2: 1,
          response,
        }));
        void handler(getUIContainer(), {
          ...base,
          overflow: 0,
          ...options,
          selectable_cards: cards,
          must_select_cards: must,
        });
      } else if (kind === "unselect") {
        const { default: handler } = await import(
          "/src/service/duel/selectUnselectCard.ts"
        );
        const selected = infos(options.selected ?? []).map((info, index) => ({
          ...info,
          response: cards.length + index,
        }));
        void handler(getUIContainer(), {
          finishable: false,
          ...base,
          selectable_cards: cards,
          selected_cards: selected,
        });
      }
    };
    window.__wire = async (bytes) => {
      const { default: handle } = await import(
        "/src/service/onSocketMessage.ts"
      );
      const wire = new Uint8Array(bytes.length + 3);
      new DataView(wire.buffer).setUint16(0, bytes.length + 1, true);
      wire[2] = 1;
      wire.set(bytes, 3);
      await handle(
        getUIContainer(),
        new MessageEvent("message", { data: wire.buffer }),
      );
    };
    window.__query = async (controller, zone, sequence, flags, values) => {
      const query = new Uint8Array(8 + values.length * 4);
      const view = new DataView(query.buffer);
      view.setUint32(0, query.length, true);
      view.setUint32(4, flags, true);
      values.forEach((value, i) => view.setInt32(8 + i * 4, value, true));
      await window.__wire([7, controller, zone, sequence, ...query]);
    };
    history.pushState({}, "", "/duel");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByTestId("duel-toolbar")).toBeVisible();
  await page.waitForTimeout(1100);
}
const card = (page: Page, uuid: string) =>
  page.locator(`[data-testid="duel-card"][data-card-uuid="${uuid}"]`);
const sent = (page: Page) => page.evaluate(() => window.__sent);
const choose = (page: Page, kind: string, options: object) =>
  page.evaluate(({ kind, options }) => window.__choose(kind, options), {
    kind,
    options,
  });
const modal = (page: Page) =>
  page.locator('[data-testid="duel-select-cards-modal"]:visible');

/** 双方同密码卡与异画卡分别验证实时改名不会混淆卡片身份。 */
async function setupNamedCards(page: Page) {
  await setup(page);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { fetchCard } = await import("/src/api/index.ts");
    const { genCard } = await import("/src/service/utils/genCard.ts");
    cardStore.inner = [
      ["name-me", 0, 0, 1000001],
      ["name-opponent", 2, 1, 1000001],
      ["name-alternate", 1, 0, 1000003],
    ].map(([uuid, sequence, controller, code]) => {
      const meta = fetchCard(code);
      return genCard({
        ...window.__make(uuid, sequence, controller),
        code,
        meta,
        originalData: { ...meta.data },
      });
    });
  });
}

// 覆盖实时查询、已经打开的详情及原始卡名提示，而非只检查静态卡库名称。
test("card-name queries update both players and the open detail while preserving printed identity", async ({
  page,
}) => {
  await setupNamedCards(page);
  await card(page, "name-me").click();
  const name = page.getByTestId("duel-card-name");
  const detail = page.getByTestId("duel-card-detail");
  await expect(name).toContainText("原卡名");
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    cardStore.inner[0].effectTargets = ["name-opponent"];
    await window.__query(0, 4, 0, 0x4, [1000002]);
  });
  await expect(name).toContainText("变更后卡名");
  await expect(name).toHaveAttribute("data-renamed", "true");
  await expect(name).toHaveCSS("color", "rgb(255, 240, 0)");
  await expect(name).toHaveAttribute("title", "原卡名：原卡名");
  await expect(detail).toHaveAttribute("data-card-code", "1000001");
  await expect(detail).toHaveAttribute("data-card-alias", "1000002");
  await expect(detail).toContainText("原卡片效果文本");
  await expect(detail.locator("img").first()).toHaveAttribute("src", /1000001/);
  await expect(card(page, "name-me")).toHaveAttribute(
    "data-card-code",
    "1000001",
  );
  const relation = card(page, "name-me").getByTestId(
    "field-card-target-relation",
  );
  await expect(relation).toHaveAttribute(
    "title",
    "效果来源 · 1：变更后卡名 → 原卡名",
  );
  await page.evaluate(async () => {
    // 不含 alias 的增量查询以及未公开卡号的查询都保留当前卡名。
    await window.__query(0, 4, 0, 0x40, [2]);
    await window.__query(0, 4, 0, 0x1 | 0x4, [0, 1000002]);
    // MSG_UPDATE_DATA 的第三个槽位对应对方怪兽，前两槽为空。
    const query = new Uint8Array(20);
    const view = new DataView(query.buffer);
    view.setUint32(0, 4, true);
    view.setUint32(4, 4, true);
    view.setUint32(8, 12, true);
    view.setUint32(12, 0x4, true);
    view.setInt32(16, 1000002, true);
    await window.__wire([6, 1, 4, ...query]);
  });
  await expect(name).toContainText("变更后卡名");
  await expect(relation).toHaveAttribute(
    "title",
    "效果来源 · 1：变更后卡名 → 变更后卡名",
  );
  await card(page, "name-opponent").click();
  await expect(name).toContainText("变更后卡名");
  await expect(name).toHaveAttribute("data-renamed", "true");
  await expect(detail).toHaveAttribute("data-card-code", "1000001");
  await page.evaluate(() => window.__query(1, 4, 2, 0x4, [0]));
  await expect(name).toContainText("原卡名");
  await expect(name).toHaveAttribute("data-renamed", "false");
  await expect(detail).toHaveAttribute("data-card-alias", "0");
  await expect(relation).toHaveAttribute(
    "title",
    "效果来源 · 1：变更后卡名 → 原卡名",
  );
});

test("printed aliases and unknown renamed cards fall back correctly and identity updates refresh the open detail", async ({
  page,
}) => {
  await setupNamedCards(page);
  await card(page, "name-alternate").click();
  const name = page.getByTestId("duel-card-name");
  const detail = page.getByTestId("duel-card-detail");
  await expect(name).toContainText("原卡名");
  await expect(name).toHaveAttribute("data-renamed", "false");
  await page.evaluate(() => window.__query(0, 4, 1, 0x4, [1000002]));
  await expect(name).toContainText("变更后卡名");
  await expect(name).toHaveAttribute("data-renamed", "true");
  await expect(detail).toContainText("异画卡片效果文本");
  for (const alias of [1000001, 1000003, 0, 987654321]) {
    await page.evaluate(
      (alias) => window.__query(0, 4, 1, 0x4, [alias]),
      alias,
    );
    await expect(name).toContainText("原卡名");
    await expect(name).toHaveAttribute("data-renamed", "false");
    await expect(detail).toHaveAttribute("data-card-alias", String(alias));
  }
  // 卡片身份与 alias 在同一包更新时，改名比较使用新身份的原始数据。
  await page.evaluate(() =>
    window.__query(0, 4, 1, 0x1 | 0x4, [1000002, 1000001]),
  );
  await expect(name).toContainText("原卡名");
  await expect(name).toHaveAttribute("data-renamed", "true");
  await expect(detail).toHaveAttribute("data-card-code", "1000002");
  await expect(detail).toContainText("另一张卡的效果文本");
  await page.evaluate(() => window.__query(0, 4, 1, 0x4, [0]));
  await expect(name).toContainText("变更后卡名");
  await expect(name).toHaveAttribute("data-renamed", "false");
});

test("renamed cards retain names through control changes and clear names on leaving, setting and becoming material", async ({
  page,
}) => {
  await setupNamedCards(page);
  await card(page, "name-me").click();
  const name = page.getByTestId("duel-card-name");
  for (const transition of [
    "control",
    "GRAVE",
    "set-position",
    "set-query",
    "overlay",
  ]) {
    const alias = await page.evaluate(async (transition) => {
      const { cardStore } = await import("/src/stores/index.ts");
      const { fetchCard, ygopro } = await import("/src/api/index.ts");
      const { getUIContainer } = await import("/src/container/compat.ts");
      const { default: move } = await import("/src/service/duel/move.ts");
      const { default: posChange } = await import(
        "/src/service/duel/posChange.ts"
      );
      const source = cardStore.inner.find((card) => card.uuid === "name-me");
      const meta = fetchCard(1000001);
      Object.assign(source, {
        ...window.__make("name-me", 0),
        code: meta.id,
        meta,
        originalData: { ...meta.data },
      });
      await window.__query(0, 4, 0, 0x4, [1000002]);
      if (transition === "set-position") {
        await posChange(getUIContainer(), {
          card_info: {
            controller: 0,
            location: ygopro.CardZone.MZONE,
            sequence: 0,
          },
          cur_position: ygopro.CardPosition.FACEDOWN_DEFENSE,
        });
      } else if (transition === "set-query") {
        await window.__query(0, 4, 0, 0x2, [0x08000400]);
      } else {
        await move(getUIContainer(), {
          code: source.code,
          from: source.location,
          to: new ygopro.CardLocation({
            controller: transition === "control" ? 1 : 0,
            zone:
              transition === "GRAVE"
                ? ygopro.CardZone.GRAVE
                : ygopro.CardZone.MZONE,
            sequence: transition === "overlay" ? 1 : 0,
            position: ygopro.CardPosition.FACEUP_ATTACK,
            is_overlay: transition === "overlay",
          }),
          reason: 0,
        });
      }
      return source.meta.data.alias;
    }, transition);
    expect(alias, transition).toBe(transition === "control" ? 1000002 : 0);
    await expect(name).toContainText(
      transition === "control" ? "变更后卡名" : "原卡名",
    );
    await expect(name).toHaveAttribute(
      "data-renamed",
      String(transition === "control"),
    );
  }
});

test("field state resets on zone changes, overlay attachment and setting, but survives control changes", async ({
  page,
}) => {
  await setup(page);
  for (const transition of [
    "control",
    "GRAVE",
    "HAND",
    "DECK",
    "EXTRA",
    "REMOVED",
    "SZONE",
    "overlay",
    "set-move",
    "set-position",
    "set-query",
  ]) {
    const state = await page.evaluate(async (transition) => {
      const { cardStore } = await import("/src/stores/index.ts");
      const { getUIContainer } = await import("/src/container/compat.ts");
      const { default: move } = await import("/src/service/duel/move.ts");
      const { default: posChange } = await import(
        "/src/service/duel/posChange.ts"
      );
      const { ygopro } = await import("/src/api/index.ts");
      const { STATUS_DISABLED, STATUS_FORBIDDEN } = await import(
        "/src/common.ts"
      );
      const [source, related] = cardStore.inner;
      Object.assign(source, window.__make("a", 0));
      Object.assign(related, window.__make("b", 1));
      source.status = STATUS_DISABLED | STATUS_FORBIDDEN | 8;
      source.counters = { 1: 3 };
      source.targeted = true;
      source.meta.data.atk = 3000;
      source.meta.data.attribute = 2;
      source.equipTarget = related.uuid;
      source.effectTargets = [related.uuid];
      related.equipTarget = source.uuid;
      related.effectTargets = [source.uuid];
      const container = getUIContainer();
      if (transition === "set-position") {
        await posChange(container, {
          card_info: {
            controller: 0,
            location: ygopro.CardZone.MZONE,
            sequence: 0,
          },
          cur_position: ygopro.CardPosition.FACEDOWN_DEFENSE,
        });
      } else if (transition === "set-query") {
        // QUERY_POSITION only: omitted status/counter fields must not retain old state.
        await window.__query(0, 4, 0, 2, [0x08000400]);
      } else {
        const to = new ygopro.CardLocation({
          controller: transition === "control" ? 1 : 0,
          zone: ygopro.CardZone[transition] ?? ygopro.CardZone.MZONE,
          sequence: transition === "overlay" ? 1 : 0,
          position:
            transition === "set-move"
              ? ygopro.CardPosition.FACEDOWN_DEFENSE
              : ygopro.CardPosition.FACEUP_ATTACK,
          is_overlay: transition === "overlay",
        });
        await move(container, {
          code: source.code,
          from: source.location,
          to,
          reason: 0,
        });
      }
      return {
        status: source.status,
        counters: { ...source.counters },
        targeted: source.targeted,
        atk: source.meta.data.atk,
        attribute: source.meta.data.attribute,
        outgoing: [
          source.equipTarget ?? null,
          [...(source.effectTargets ?? [])],
        ],
        incoming: [
          related.equipTarget ?? null,
          [...(related.effectTargets ?? [])],
        ],
      };
    }, transition);
    if (transition === "control") {
      expect(state).toEqual({
        status: 0x4000009,
        counters: { 1: 3 },
        targeted: true,
        atk: 3000,
        attribute: 2,
        outgoing: ["b", ["b"]],
        incoming: ["a", ["a"]],
      });
      await expect(card(page, "a")).toHaveAttribute(
        "data-card-disabled",
        "true",
      );
    } else {
      expect(state, transition).toEqual({
        status: 8,
        counters: {},
        targeted: false,
        atk: 1800,
        attribute: 1,
        outgoing: [null, []],
        incoming: [null, []],
      });
      await expect(card(page, "a")).toHaveAttribute(
        "data-card-disabled",
        "false",
      );
    }
  }
  // Flipping face up again must not restore stale negation or counters.
  await page.evaluate(async () => {
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: posChange } = await import(
      "/src/service/duel/posChange.ts"
    );
    const { ygopro } = await import("/src/api/index.ts");
    await posChange(getUIContainer(), {
      card_info: {
        controller: 0,
        location: ygopro.CardZone.MZONE,
        sequence: 0,
      },
      cur_position: ygopro.CardPosition.FACEUP_ATTACK,
    });
  });
  await expect(card(page, "a")).toHaveAttribute("data-card-disabled", "false");
  await expect(card(page, "a").getByTestId("field-card-counter")).toHaveCount(
    0,
  );
});

test("negation is displayed only on face-up field cards even when query status is present elsewhere", async ({
  page,
}) => {
  await setup(page);
  const states = await page.evaluate(async () => {
    const { cardStore, isCardDisabled } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const source = cardStore.inner[0];
    return [1, 0x4000000].flatMap((status) =>
      [
        ygopro.CardZone.MZONE,
        ygopro.CardZone.SZONE,
        ygopro.CardZone.GRAVE,
        ygopro.CardZone.REMOVED,
        ygopro.CardZone.HAND,
        ygopro.CardZone.DECK,
        ygopro.CardZone.EXTRA,
      ].flatMap((zone) =>
        [
          ygopro.CardPosition.FACEUP_ATTACK,
          ygopro.CardPosition.FACEDOWN_DEFENSE,
        ].flatMap((position) =>
          [false, true].map((is_overlay) => {
            source.status = status;
            Object.assign(source.location, { zone, position, is_overlay });
            return {
              actual: isCardDisabled(source),
              expected:
                [ygopro.CardZone.MZONE, ygopro.CardZone.SZONE].includes(zone) &&
                position === ygopro.CardPosition.FACEUP_ATTACK &&
                !is_overlay,
            };
          }),
        ),
      ),
    );
  });
  for (const state of states) expect(state.actual).toBe(state.expected);
  await expect(card(page, "a")).toHaveAttribute("data-card-disabled", "false");
});

test("incomplete summon hints appear only before detail text and update with query status", async ({
  page,
}) => {
  await setup(page);
  const results = await page.evaluate(async () => {
    const { cardStore, hasIncompleteSummon } = await import(
      "/src/stores/index.ts"
    );
    const { ygopro } = await import("/src/api/index.ts");
    const results = [];
    for (const type of [
      0x41, 0x81, 0x2001, 0x800001, 0x4000001, 0x2000001, 1, 0x82,
    ]) {
      for (const zone of [
        ygopro.CardZone.GRAVE,
        ygopro.CardZone.REMOVED,
        ygopro.CardZone.MZONE,
        ygopro.CardZone.HAND,
        ygopro.CardZone.EXTRA,
      ]) {
        for (const status of [0, 8]) {
          const source = window.__make("hint", 0, 0, zone);
          source.meta.data.type = source.originalData.type = type;
          source.status = status;
          results.push({
            actual: hasIncompleteSummon(source),
            expected:
              ![1, 0x82].includes(type) &&
              [ygopro.CardZone.GRAVE, ygopro.CardZone.REMOVED].includes(zone) &&
              status === 0,
          });
          source.location.position = ygopro.CardPosition.FACEDOWN_DEFENSE;
          results.push({
            actual: hasIncompleteSummon(source),
            expected: false,
          });
          source.location.position = ygopro.CardPosition.FACEUP_ATTACK;
          source.location.is_overlay = true;
          results.push({
            actual: hasIncompleteSummon(source),
            expected: false,
          });
        }
      }
    }
    const source = window.__make("hint", 0, 0, ygopro.CardZone.GRAVE);
    source.meta.data.type = source.originalData.type = 0x41;
    source.meta.text.desc = "卡片效果文本";
    cardStore.inner = [source];
    const { displayCardListModal } = await import(
      "/src/ui/Duel/Message/CardListModal/index.tsx"
    );
    displayCardListModal({
      isZone: true,
      zone: ygopro.CardZone.GRAVE,
      controller: 0,
    });
    return results;
  });
  for (const result of results) expect(result.actual).toBe(result.expected);
  const list = page.getByTestId("duel-card-list-drawer");
  await expect(page.getByTestId("card-summon-incomplete")).toHaveCount(0);
  await list.locator("img").locator("..").click();
  const detail = page.getByTestId("duel-card-detail");
  const hint = detail.getByTestId("card-summon-incomplete");
  await expect(hint).toHaveText("未正规登场");
  await expect(hint).toHaveCSS("color", "rgb(15, 255, 15)");
  expect(
    await hint.evaluate((node) => node.nextElementSibling?.textContent),
  ).toContain("卡片效果文本");
  await expect(page.getByTestId("card-summon-incomplete")).toHaveCount(1);
  await page.screenshot({
    path: "/tmp/neos-incomplete-summon.png",
    animations: "disabled",
  });
  // A fresh QUERY_STATUS updates the open detail without reopening it.
  await page.evaluate(() => window.__query(0, 16, 0, 0x80000, [8]));
  await expect(list.getByTestId("card-summon-incomplete")).toHaveCount(0);
  await expect(detail.getByTestId("card-summon-incomplete")).toHaveCount(0);
  await page.evaluate(() => window.__query(0, 16, 0, 0x80000, [0]));
  await expect(list.getByTestId("card-summon-incomplete")).toHaveCount(0);
  await expect(detail.getByTestId("card-summon-incomplete")).toBeVisible();
  await choose(page, "card", { ids: ["hint"] });
  await expect(modal(page).getByTestId("card-summon-incomplete")).toHaveCount(
    0,
  );
  await modal(page).getByTestId("duel-select-card-option").click();
  await expect(detail.getByTestId("card-summon-incomplete")).toBeVisible();
});

for (const width of [1280, 390, 320]) {
  test(`field targeting previews a known set card instead of retaining the activating card at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 320 ? 640 : 844 });
    await setup(page);
    await page.evaluate(async () => {
      const { cardStore } = await import("/src/stores/index.ts");
      const { fetchCard, ygopro } = await import("/src/api/index.ts");
      const { getUIContainer } = await import("/src/container/compat.ts");
      const { showCardModal } = await import(
        "/src/ui/Duel/Message/CardModal/index.tsx"
      );
      const { default: selectCard } = await import(
        "/src/service/duel/selectCard.ts"
      );
      const source = cardStore.inner[2];
      source.code = 22377092;
      source.meta = {
        id: 22377092,
        data: { type: 4 },
        text: { name: "沉迷陷溺", desc: "以自己场上1张魔法·陷阱卡为对象" },
      };
      const targets = cardStore.inner.slice(0, 2);
      targets.forEach((target, index) => {
        target.code = 1000001 + index;
        target.meta = fetchCard(target.code);
        target.location.zone = ygopro.CardZone.SZONE;
        target.location.position = ygopro.CardPosition.FACEDOWN_DEFENSE;
      });
      showCardModal(source);
      void selectCard(getUIContainer(), {
        cancelable: true,
        min: 1,
        max: 1,
        cards: targets.map((target, response) => ({
          code: target.code,
          location: target.location,
          response,
        })),
      });
    });
    const detail = page.getByTestId("duel-card-detail");
    await expect(page.getByTestId("field-selection")).toBeVisible();
    await expect(detail).toHaveAttribute("data-card-code", "22377092");
    await card(page, "a").click();
    await expect(card(page, "a")).toHaveAttribute("data-card-selected", "true");
    await expect(detail).toHaveAttribute("data-card-code", "1000001", {
      timeout: 2000,
    });
    await expect(detail).toContainText("原卡片效果文本");
    await card(page, "b").click();
    await expect(detail).toHaveAttribute("data-card-code", "1000002");
    await page.getByTestId("field-selection-submit").click();
    expect((await sent(page)).at(-1).slice(2)).toEqual([1, 1, 1]);
  });
}

test("tribute, sum and incremental field selection preview mandatory and selected cards without changing response rules", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { fetchCard } = await import("/src/api/index.ts");
    cardStore.inner.slice(0, 3).forEach((target, index) => {
      target.code = 1000001 + index;
      target.meta = fetchCard(target.code);
    });
  });
  const detail = page.getByTestId("duel-card-detail");
  await choose(page, "tribute", {
    ids: ["a", "b"],
    values: [{ level: 1 }, { level: 1 }],
  });
  await card(page, "b").click();
  await expect(detail).toHaveAttribute("data-card-code", "1000002");
  await page.getByTestId("field-selection-submit").click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 1, 1]);

  await choose(page, "sum", {
    ids: ["a", "b"],
    must: ["c"],
    level_sum: 2,
    values: [
      { level1: 1, level2: 1 },
      { level1: 1, level2: 1 },
    ],
  });
  await card(page, "c").click();
  await expect(detail).toHaveAttribute("data-card-code", "1000003");
  await expect(card(page, "c")).toHaveAttribute("data-card-selected", "true");
  expect(await sent(page)).toEqual([]);
  await card(page, "b").click();
  await expect(detail).toHaveAttribute("data-card-code", "1000002");
  await page.getByTestId("field-selection-submit").click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 2, 0, 1]);

  await choose(page, "unselect", { ids: ["a"], selected: ["b"] });
  await card(page, "b").click();
  await expect(detail).toHaveAttribute("data-card-code", "1000002");
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 1, 1]);

  await choose(page, "card", { ids: ["a", "b", "c"], min: 2, max: 2 });
  await card(page, "a").click();
  await card(page, "b").click();
  await expect(card(page, "c")).toHaveAttribute(
    "data-card-selectable",
    "false",
  );
  await card(page, "c").click();
  await expect(detail).toHaveAttribute("data-card-code", "1000003");
  await expect(card(page, "c")).toHaveAttribute("data-card-selected", "false");
  await page.getByTestId("field-selection-submit").click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 2, 0, 1]);
});

test("field previews use the message identity without revealing unknown cards or retaining stale details", async ({
  page,
}) => {
  await setup(page);
  const detail = page.getByTestId("duel-card-detail");
  for (const [liveCode, messageCode] of [
    [0, 1000001],
    [0, 0],
    [1000001, 1000002],
  ]) {
    await page.evaluate(
      async ({ liveCode, messageCode }) => {
        const { cardStore } = await import("/src/stores/index.ts");
        const { fetchCard, ygopro } = await import("/src/api/index.ts");
        const { getUIContainer } = await import("/src/container/compat.ts");
        const { showCardModal } = await import(
          "/src/ui/Duel/Message/CardModal/index.tsx"
        );
        const { default: selectCard } = await import(
          "/src/service/duel/selectCard.ts"
        );
        const target = cardStore.inner[0];
        target.code = liveCode;
        target.meta = fetchCard(liveCode);
        target.location.zone = ygopro.CardZone.SZONE;
        target.location.position = ygopro.CardPosition.FACEDOWN_ATTACK;
        showCardModal(cardStore.inner[1]);
        window.__sent = [];
        void selectCard(getUIContainer(), {
          cancelable: true,
          min: 1,
          max: 1,
          cards: [
            { code: messageCode, location: target.location, response: 7 },
          ],
        });
      },
      { liveCode, messageCode },
    );
    await expect(page.getByTestId("field-selection")).toBeVisible();
    await card(page, "a").click();
    await expect(detail).toHaveAttribute("data-card-code", String(messageCode));
    await expect(card(page, "a")).toHaveAttribute(
      "data-card-code",
      String(liveCode),
    );
    if (liveCode === 0)
      await expect(
        card(page, "a").getByTestId("duel-set-card-preview"),
      ).toHaveCount(0);
    await page.getByTestId("field-selection-submit").click();
    expect((await sent(page)).at(-1).slice(2)).toEqual([1, 1, 7]);
  }
});

test("known set backrow cards follow the Neos animation setting regardless of system motion", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { fetchCard, ygopro } = await import("/src/api/index.ts");
    const { genCard } = await import("/src/service/utils/genCard.ts");
    const { SZONE, MZONE, EXTRA } = ygopro.CardZone;
    const { FACEDOWN_ATTACK, FACEUP_ATTACK, FACEDOWN_DEFENSE } =
      ygopro.CardPosition;
    cardStore.inner = [
      ["set-me", 0, SZONE, 1, 1000001, FACEDOWN_ATTACK],
      ["set-op", 1, SZONE, 1, 1000002, FACEDOWN_ATTACK],
      ["unknown-op", 1, SZONE, 2, 0, FACEDOWN_ATTACK],
      ["faceup", 0, SZONE, 3, 1000001, FACEUP_ATTACK],
      ["monster", 0, MZONE, 0, 1000001, FACEDOWN_DEFENSE],
      ["extra", 0, EXTRA, 0, 1000001, FACEDOWN_DEFENSE],
    ].map(([uuid, controller, zone, sequence, code, position]) =>
      genCard({
        ...window.__make(uuid, sequence, controller, zone),
        code,
        meta: fetchCard(code),
        location: new ygopro.CardLocation({
          controller,
          zone,
          sequence,
          position,
        }),
      }),
    );
  });
  const previews = page.getByTestId("duel-set-card-preview");
  const preview = card(page, "set-me").getByTestId("duel-set-card-preview");
  await expect(previews).toHaveCount(2);
  const sampleFade = () =>
    preview.evaluate((node) => {
      const animation = node.getAnimations()[0];
      animation.pause();
      return [0, 1570, 3140].map((time) => {
        animation.currentTime = time;
        const { opacity, filter } = getComputedStyle(node);
        return { opacity: Number(opacity), filter };
      });
    });
  const fadeFrames = [
    { opacity: 0.5, filter: "brightness(0.5)" },
    { opacity: 0.9, filter: "brightness(0.9)" },
    { opacity: 0.5, filter: "brightness(0.5)" },
  ];
  expect(await sampleFade()).toEqual(fadeFrames);
  await expect(preview).toHaveCSS("pointer-events", "none");
  await page.evaluate(async () => {
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    settingStore.animation.enabled = false;
  });
  await expect(preview).toHaveCSS("animation-name", "none");
  await expect(preview).toHaveCSS("opacity", "0.7");
  await expect(preview).toHaveCSS("filter", "brightness(0.7)");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(preview).toHaveCSS("animation-name", "none");
  await page.evaluate(async () => {
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    settingStore.animation.enabled = true;
  });
  await expect(page.locator("html")).toHaveAttribute(
    "data-neos-animation",
    "enabled",
  );
  await expect(preview).not.toHaveCSS("animation-name", "none", {
    timeout: 1500,
  });
  expect(await sampleFade()).toEqual(fadeFrames);
  await page.evaluate(async () => {
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    settingStore.saveAnimationConfig({ enabled: false });
  });
  await expect(preview).toHaveCSS("animation-name", "none");
  await expect(preview).toHaveCSS("opacity", "0.7");
  await expect(preview).toHaveCSS("filter", "brightness(0.7)");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(preview).toHaveCSS("animation-name", "none");
  await page.evaluate(async () => {
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    settingStore.saveAnimationConfig({ enabled: true });
  });
  await expect(preview).not.toHaveCSS("animation-name", "none");
  await page.evaluate(async () => {
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: posChange } = await import(
      "/src/service/duel/posChange.ts"
    );
    const { ygopro } = await import("/src/api/index.ts");
    const { cardStore } = await import("/src/stores/index.ts");
    await posChange(getUIContainer(), {
      card_info: {
        controller: 0,
        location: ygopro.CardZone.SZONE,
        sequence: 1,
      },
      prev_position: ygopro.CardPosition.FACEDOWN_ATTACK,
      cur_position: ygopro.CardPosition.FACEUP_ATTACK,
      code: 1000001,
    });
    cardStore.inner.find((c) => c.uuid === "set-op").code = 0;
  });
  await expect(previews).toHaveCount(0);
});

test("field card selection replaces a single choice, collects multiple choices and falls back for mixed zones", async ({
  page,
}, info) => {
  await setup(page);
  await choose(page, "card", { ids: ["a", "b"] });
  await expect(page.getByTestId("field-selection")).toBeVisible();
  await expect(modal(page)).toHaveCount(0);
  await card(page, "a").click();
  await card(page, "b").click();
  await expect(card(page, "a")).toHaveAttribute("data-card-selected", "false");
  await expect(card(page, "b")).toHaveAttribute("data-card-selected", "true");
  await card(page, "c").click();
  expect(await sent(page)).toEqual([]);
  await page.getByTestId("field-selection-submit").click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 1, 1]);
  await expect(card(page, "b")).toHaveAttribute("data-card-selected", "false");
  await choose(page, "card", { ids: ["a", "b", "c"], min: 2, max: 2 });
  await card(page, "a").click();
  await expect(page.getByTestId("field-selection-submit")).toBeDisabled();
  await card(page, "b").click();
  await expect(card(page, "c")).toHaveAttribute(
    "data-card-selectable",
    "false",
  );
  await expect(page.getByTestId("field-selection-submit")).toBeEnabled();
  await page.screenshot({ path: info.outputPath("field-selection.png") });
  await page.getByTestId("field-selection-submit").click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 2, 0, 1]);
  await choose(page, "card", { ids: ["a", "b"] });
  await page.getByTestId("field-selection-cancel").click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 255, 255, 255, 255]);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    cardStore.inner[1].location.zone = ygopro.CardZone.HAND;
  });
  await choose(page, "card", { ids: ["a", "b"] });
  await expect(modal(page)).toBeVisible();
  await expect(page.getByTestId("field-selection")).not.toBeVisible();
});

test("incremental material selection cancels and finishes from the bottom tips", async ({
  page,
}, info) => {
  await setup(page);
  await expect(
    page
      .getByTestId("duel-toolbar")
      .getByRole("button", { name: "取消选择", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(async () => {
    const { matStore } = await import("/src/stores/index.ts");
    matStore.hint.esSelectHint = "请选择融合素材";
  });
  await choose(page, "unselect", { ids: ["a", "b", "c"], min: 3, max: 3 });
  await expect(page.getByTestId("field-selection")).toContainText(
    "请选择融合素材",
  );
  await expect(page.getByTestId("field-selection-cancel")).toBeEnabled();
  await expect(page.getByTestId("field-selection-submit")).toHaveCount(0);
  await card(page, "a").click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 1, 0]);
  await expect(page.getByTestId("field-selection")).not.toBeVisible();

  await choose(page, "unselect", {
    ids: ["b", "c"],
    selected: ["a"],
    min: 3,
    max: 3,
  });
  await expect(card(page, "a")).toHaveAttribute("data-card-selected", "true");
  await expect(page.getByTestId("field-selection-progress")).toHaveText("1 张");
  await page.screenshot({
    path: info.outputPath("incremental-selection-tips.png"),
  });
  await page.getByTestId("field-selection-cancel").click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 255, 255, 255, 255]);
  await expect(card(page, "a")).toHaveAttribute("data-card-selected", "false");
  await expect(card(page, "b")).toHaveAttribute(
    "data-card-selectable",
    "false",
  );
  await expect(page.getByTestId("field-selection")).not.toBeVisible();

  await choose(page, "unselect", { ids: ["a", "b"], cancelable: false });
  await expect(page.getByTestId("field-selection")).toBeVisible();
  await expect(page.getByTestId("field-selection-cancel")).toHaveCount(0);
  await expect(page.getByTestId("field-selection-submit")).toHaveCount(0);
  expect(await sent(page)).toEqual([]);

  await choose(page, "unselect", {
    ids: ["b", "c"],
    selected: ["a"],
    finishable: true,
    cancelable: true,
    min: 1,
    max: 3,
  });
  await expect(page.getByTestId("field-selection-cancel")).toHaveCount(0);
  await expect(page.getByTestId("field-selection-submit")).toHaveText(
    "完成选择",
  );
  await page.getByTestId("field-selection-submit").click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 255, 255, 255, 255]);
  await expect(page.getByTestId("field-selection")).not.toBeVisible();

  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    cardStore.inner[0].location.zone = ygopro.CardZone.GRAVE;
  });
  await choose(page, "unselect", { ids: ["a"] });
  await expect(modal(page)).toBeVisible();
  await expect(page.getByTestId("field-selection")).not.toBeVisible();
  await page.locator('[data-testid="duel-select-card-cancel"]:visible').click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 255, 255, 255, 255]);
});

test("Zoroa field-first targeting preserves cancellation and then offers graveyard targets", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    cardStore.inner.push(
      window.__make("grave-target", 0, 0, ygopro.CardZone.GRAVE),
    );
    window.__selectTarget = async (cancelable, ids) => {
      const cards = ids.map((id) => cardStore.inner.find((c) => c.uuid === id));
      const bytes = [15, 0, Number(cancelable), 1, 1, cards.length];
      for (const card of cards) {
        const code = new Uint8Array(4);
        new DataView(code.buffer).setUint32(0, card.code, true);
        bytes.push(
          ...code,
          card.location.controller,
          card.location.zone === ygopro.CardZone.GRAVE ? 0x10 : 0x04,
          card.location.sequence,
          1,
        );
      }
      await window.__wire(bytes);
    };
  });

  // 37260677 的①效果先发可取消的场上选择，取消后才发完整候选。
  await page.evaluate(() => window.__selectTarget(true, ["op"]));
  await expect(page.getByTestId("field-selection-cancel")).toBeVisible({
    timeout: 3000,
  });
  expect(await sent(page)).toEqual([]);
  await page.getByTestId("field-selection-cancel").click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 255, 255, 255, 255]);
  await page.evaluate(() =>
    window.__selectTarget(false, ["op", "grave-target"]),
  );
  await expect(modal(page)).toBeVisible();
  await expect(page.getByTestId("field-selection")).not.toBeVisible();
  const grave = modal(page).locator(
    '[data-testid="duel-select-card-option"][data-card-zone="GRAVE"][data-card-controller="0"]',
  );
  await expect(grave).toHaveCount(1);
  await grave.click();
  await page.locator('[data-testid="duel-select-card-submit"]:visible').click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 1, 1]);

  // 普通的不可取消单候选仍然可以自动提交。
  await page.evaluate(async () => {
    window.__sent = [];
    await window.__selectTarget(false, ["op"]);
  });
  await expect.poll(() => sent(page)).toEqual([[3, 0, 1, 1, 0]]);
  await expect(page.getByTestId("field-selection")).not.toBeVisible();
});

test("tribute contributions, mixed sum values, mandatory cards and minimal overflow use protocol rules", async ({
  page,
}) => {
  await setup(page);
  await choose(page, "tribute", {
    ids: ["a", "b", "c"],
    min: 2,
    max: 2,
    values: [{ level: 2 }, { level: 1 }, { level: 1 }],
  });
  await card(page, "b").click();
  await expect(page.getByTestId("field-selection-submit")).toBeDisabled();
  await card(page, "b").click();
  await card(page, "a").click();
  await expect(page.getByTestId("field-selection-submit")).toBeEnabled();
  await page.getByTestId("field-selection-submit").click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 1, 0]);
  await choose(page, "tribute", {
    ids: ["a", "b"],
    min: 2,
    max: 2,
    values: [{ level: 2 }, { level: 1 }],
  });
  await page.getByTestId("field-selection-cancel").click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 255, 255, 255, 255]);
  await choose(page, "sum", {
    ids: ["a", "b", "d"],
    must: ["c"],
    min: 2,
    max: 2,
    level_sum: 8,
    values: [
      { level1: 2, level2: 4 },
      { level1: 3, level2: 5 },
      { level1: 9, level2: 9 },
    ],
  });
  await expect(card(page, "c")).toHaveAttribute("data-card-selected", "true");
  await expect(card(page, "d")).toHaveAttribute(
    "data-card-selectable",
    "false",
  );
  await card(page, "c").click();
  await expect(card(page, "c")).toHaveAttribute("data-card-selected", "true");
  await card(page, "a").click();
  await card(page, "b").click();
  await expect(page.getByTestId("field-selection-submit")).toBeEnabled();
  await page.getByTestId("field-selection-submit").click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 3, 0, 0, 1]);
  await choose(page, "sum", {
    ids: ["a", "b", "c"],
    min: 0,
    max: 0,
    overflow: 1,
    level_sum: 8,
    values: [{ level1: 5 }, { level1: 4 }, { level1: 1 }],
  });
  await card(page, "a").click();
  await card(page, "b").click();
  await expect(page.getByTestId("field-selection-submit")).toBeEnabled();
  await expect(card(page, "c")).toHaveAttribute(
    "data-card-selectable",
    "false",
  );
  await card(page, "c").click();
  await page.getByTestId("field-selection-submit").click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 2, 0, 1]);
  // The modal must accept the same mixed-level combination.
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    for (const c of cardStore.inner) c.location.zone = ygopro.CardZone.GRAVE;
  });
  await choose(page, "sum", {
    ids: ["a", "b"],
    min: 2,
    max: 2,
    level_sum: 7,
    values: [
      { level1: 2, level2: 4 },
      { level1: 3, level2: 5 },
    ],
  });
  await expect(modal(page)).toBeVisible();
  await modal(page).getByTestId("duel-select-card-option").nth(0).click();
  await modal(page).getByTestId("duel-select-card-option").nth(1).click();
  await page.locator('[data-testid="duel-select-card-submit"]:visible').click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 2, 0, 1]);
});

test("overlay candidates keep their identity and can be unselected without binding the host", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const { default: handler } = await import(
      "/src/service/duel/selectUnselectCard.ts"
    );
    const { getUIContainer } = await import("/src/container/compat.ts");
    const material = window.__make("material", 0);
    material.code = 89631139;
    material.meta.id = 89631139;
    material.location = new ygopro.CardLocation({
      controller: 0,
      zone: ygopro.CardZone.MZONE,
      sequence: 0,
      is_overlay: true,
      overlay_sequence: 0,
    });
    cardStore.inner.push(material);
    window.__found = cardStore.find(material.location)?.uuid;
    void handler(getUIContainer(), {
      finishable: true,
      cancelable: true,
      min: 1,
      max: 2,
      selectable_cards: [],
      selected_cards: [{ code: 0, location: material.location, response: 4 }],
    });
  });
  expect(await page.evaluate(() => window.__found)).toBe("material");
  await expect(card(page, "a")).toHaveAttribute("data-card-selected", "false");
  const option = modal(page).getByTestId("duel-select-card-option");
  await expect(option).toHaveAttribute("data-card-code", "89631139");
  await expect(option.locator(".ant-pro-checkcard")).toHaveCSS(
    "border-top-color",
    "rgb(0, 135, 230)",
  );
  await option.click();
  await page.locator('[data-testid="duel-select-card-submit"]:visible').click();
  expect((await sent(page)).at(-1).slice(2)).toEqual([1, 1, 4]);
});

test("field markers use live queries and Link highlights respect both players and shared extra zones", async ({
  page,
}, info) => {
  await setup(page);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const { TYPE_LINK, TYPE_PENDULUM, TYPE_SPELL } = await import(
      "/src/common.ts"
    );
    const link = cardStore.inner.find((c) => c.uuid === "c");
    link.meta.data.type = 1 | TYPE_LINK;
    link.meta.data.linkMarkers = 64 | 256 | 8 | 32;
    link.meta.data.link = 4;
    const opponent = window.__make("op-link", 5, 1);
    opponent.meta.data.type = 1 | TYPE_LINK;
    opponent.meta.data.linkMarkers = 1 | 2 | 4;
    const left = window.__make("scale-left", 0, 0, ygopro.CardZone.SZONE);
    left.meta.data = { type: TYPE_SPELL | TYPE_PENDULUM, lscale: 2, rscale: 8 };
    left.originalData = { ...left.meta.data };
    const right = window.__make("scale-right", 4, 0, ygopro.CardZone.SZONE);
    right.meta.data = {
      type: TYPE_SPELL | TYPE_PENDULUM,
      lscale: 2,
      rscale: 8,
    };
    right.originalData = { ...right.meta.data };
    const spell = window.__make("spell", 1, 0, ygopro.CardZone.SZONE);
    spell.meta.data.type = TYPE_SPELL;
    cardStore.inner.push(left, right, spell, opponent);
    await window.__query(0, 8, 0, 0x200000, [0]);
    await window.__query(0, 8, 4, 0x400000, [10]);
    await window.__query(0, 4, 0, 0x8 | 0x40 | 0x80, [1 | 0x1000, 16, 2]);
    await window.__query(0, 4, 2, 0x800000, [4, 64 | 256 | 8 | 32]);
  });
  await expect(
    card(page, "scale-left").getByTestId("field-card-scale"),
  ).toHaveText("0");
  await expect(
    card(page, "scale-left").getByTestId("field-card-scale"),
  ).toHaveAttribute("data-change", "down");
  await expect(
    card(page, "scale-right").getByTestId("field-card-scale"),
  ).toHaveText("10");
  await expect(
    card(page, "scale-right").getByTestId("field-card-scale"),
  ).toHaveAttribute("data-change", "up");
  await expect(card(page, "a").getByTestId("field-card-tuner")).toHaveAttribute(
    "data-changed",
    "true",
  );
  await expect(
    card(page, "a").getByTestId("field-card-attribute"),
  ).toHaveAttribute("data-changed", "true");
  await expect(card(page, "a").getByTestId("field-card-race")).toHaveAttribute(
    "data-race",
    "2",
  );
  await expect(
    card(page, "c").getByTestId("field-card-link-arrows").locator("path"),
  ).toHaveCount(4);
  await card(page, "c").hover();
  for (const seq of [1, 3, 5, 6])
    await expect(
      page.locator(
        `[data-testid="duel-zone"][data-zone="MZONE"][data-controller="0"][data-sequence="${seq}"]`,
      ),
    ).toHaveAttribute("data-linked", "true");
  await card(page, "op-link").hover();
  for (const seq of [0, 1, 2])
    await expect(
      page.locator(
        `[data-testid="duel-zone"][data-zone="MZONE"][data-controller="1"][data-sequence="${seq}"]`,
      ),
    ).toHaveAttribute("data-linked", "true");
  await page.evaluate(() =>
    window.__query(1, 4, 5, 0x800000, [3, 64 | 128 | 256]),
  );
  for (const seq of [2, 3, 4])
    await expect(
      page.locator(
        `[data-testid="duel-zone"][data-zone="MZONE"][data-controller="0"][data-sequence="${seq}"]`,
      ),
    ).toHaveAttribute("data-linked", "true");
  for (const [type, kind] of [
    [2, "spell"],
    [4, "trap"],
    [2 | 0x10000, "quickplay"],
    [2 | 0x20000, "continuous"],
    [2 | 0x40000, "equip"],
    [2 | 0x80000, "field"],
    [4 | 0x100000, "counter-trap"],
    [2 | 0x80, "ritual"],
  ]) {
    await page.evaluate((type) => window.__query(0, 8, 1, 8, [type]), type);
    await expect(
      card(page, "spell").getByTestId("field-card-spell-type"),
    ).toHaveAttribute("data-kind", kind);
  }
  await page.screenshot({ path: info.outputPath("field-markers.png") });
  await page.evaluate(() =>
    window.__query(0, 4, 0, 0x8 | 0x40 | 0x80, [1, 1, 1]),
  );
  await expect(card(page, "a").getByTestId("field-card-race")).toHaveCount(0);
  await expect(card(page, "a").getByTestId("field-card-tuner")).toHaveCount(0);
  await expect(
    card(page, "a").getByTestId("field-card-attribute"),
  ).toHaveAttribute("data-changed", "false");
});

for (const layout of ["horizontal", "reverse", "opponent", "vertical"]) {
  test(`adjacent chain relation avoids card faces (${layout})`, async ({
    page,
  }, info) => {
    await setup(page);
    await page.evaluate(async (layout) => {
      const { cardStore, matStore } = await import("/src/stores/index.ts");
      const { ygopro } = await import("/src/api/index.ts");
      const controller = layout === "opponent" ? 1 : 0;
      const target = window.__make(
        "relation-target",
        layout === "vertical" ? 2 : 1,
        controller,
      );
      const source = window.__make(
        "relation-source",
        2,
        controller,
        layout === "vertical" ? ygopro.CardZone.SZONE : ygopro.CardZone.MZONE,
      );
      if (layout === "horizontal" || layout === "opponent")
        source.location.position = ygopro.CardPosition.FACEUP_DEFENSE;
      if (layout === "reverse")
        target.location.position = ygopro.CardPosition.FACEUP_DEFENSE;
      matStore.selfType = ygopro.StocTypeChange.SelfType.PLAYER1;
      cardStore.inner = [target, source];
      matStore.chainCards = [
        {
          code: source.code,
          controller,
          cardUuid: source.uuid,
          targets: [target.uuid],
          solved: false,
        },
      ];
    }, layout);
    await card(page, "relation-source")
      .getByTestId("field-card-chain-relation")
      .click();
    await page.mouse.move(0, 0);
    const relation = page.getByTestId("field-relation");
    await expect(relation).toHaveAttribute("data-source", "relation-source");
    await expect(relation).toHaveAttribute("data-target", "relation-target");
    const result = await relation.evaluate((node) => {
      const element = node as SVGPathElement;
      const transform = element.getScreenCTM()!;
      const cards = ["relation-source", "relation-target"].map((uuid) => ({
        uuid,
        bounds: document
          .querySelector(`[data-card-uuid="${uuid}"] [class*="img-wrap"]`)!
          .getBoundingClientRect(),
      }));
      const crossed = new Set<string>();
      const length = element.getTotalLength();
      for (let i = 0; i <= 100; ++i) {
        const point = element
          .getPointAtLength((length * i) / 100)
          .matrixTransform(transform);
        for (const { uuid, bounds } of cards) {
          if (
            point.x > bounds.left + 2 &&
            point.x < bounds.right - 2 &&
            point.y > bounds.top + 2 &&
            point.y < bounds.bottom - 2
          )
            crossed.add(uuid);
        }
      }
      return { path: element.getAttribute("d"), crossed: [...crossed] };
    });
    await page.screenshot({
      path: info.outputPath("adjacent-chain-relation.png"),
    });
    expect(result.crossed, `Relation path: ${result.path}`).toEqual([]);
  });
}

test("equipment and persistent target events draw distinct relations and clear on cancel or leaving the field", async ({
  page,
}, info) => {
  await setup(page);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const equip = window.__make("equip", 1, 0, ygopro.CardZone.SZONE);
    equip.meta.data.type = 2 | 0x40000;
    cardStore.inner.push(equip);
    await window.__wire([93, 0, 8, 1, 1, 0, 4, 0, 1]);
    await window.__wire([96, 0, 4, 0, 1, 1, 4, 2, 1]);
  });
  // Relationship badges remain visible without inspecting either endpoint.
  const equipSource = card(page, "equip").getByTestId(
    "field-card-equip-relation",
  );
  const equipTarget = card(page, "a").getByTestId("field-card-equip-relation");
  await expect(equipSource).toBeVisible();
  await expect(equipTarget).toBeVisible();
  await expect(equipSource).toHaveAttribute("data-role", "source");
  await expect(equipTarget).toHaveAttribute("data-role", "target");
  await expect(equipSource).toHaveAttribute("data-relation-number", "1");
  await expect(equipTarget).toHaveAttribute("data-relation-number", "1");
  await expect(equipSource).toHaveAccessibleName(/装备卡.*equip → a/);
  await expect(equipTarget).toHaveAccessibleName(/被装备卡.*equip → a/);
  await expect(
    card(page, "a").getByTestId("field-card-target-relation"),
  ).toHaveAttribute("data-role", "source");
  await expect(
    card(page, "op").getByTestId("field-card-target-relation"),
  ).toHaveAttribute("data-role", "target");
  await equipTarget.click();
  await page.mouse.move(0, 0);
  await expect(page.getByTestId("field-relation")).toHaveCount(2);
  expect(await sent(page)).toEqual([]);
  // The badge pins only the relation view, without opening the card detail drawer.
  await expect(equipTarget).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator('[data-testid="field-relation"][data-kind="equip"]'),
  ).toHaveAttribute("data-source", "equip");
  await expect(
    page.locator('[data-testid="field-relation"][data-kind="target"]'),
  ).toHaveAttribute("data-target", "op");
  await expect(
    card(page, "a").getByTestId("field-card-equip-relation"),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/neos-field-relations.png" });
  await page.screenshot({ path: info.outputPath("field-relations.png") });
  await page.evaluate(() => window.__wire([97, 0, 4, 0, 1, 1, 4, 2, 1]));
  await expect(page.getByTestId("field-relation")).toHaveCount(1);
  await page.evaluate(() => window.__wire([95, 0, 8, 1, 1]));
  await expect(page.getByTestId("field-relation")).toHaveCount(0);
  await page.evaluate(async () => {
    // Query updates must preserve then clear relationship data as well.
    await window.__query(0, 8, 1, 0x4000, [0x01000400]);
    await window.__query(0, 4, 0, 0x8000, [1, 0x01020401]);
  });
  await expect(page.getByTestId("field-relation")).toHaveCount(2);
  await page.evaluate(() => window.__query(0, 4, 0, 0x8000, [0]));
  await expect(page.getByTestId("field-relation")).toHaveCount(1);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: move } = await import("/src/service/duel/move.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const source = cardStore.inner.find((c) => c.uuid === "a");
    await move(getUIContainer(), {
      code: source.code,
      from: source.location,
      to: new ygopro.CardLocation({
        controller: 1,
        zone: ygopro.CardZone.MZONE,
        sequence: 1,
        position: ygopro.CardPosition.FACEUP_ATTACK,
      }),
      reason: 0,
    });
    cardStore.inner.push(window.__make("replacement", 0));
  });
  await card(page, "equip").hover();
  await expect(page.getByTestId("field-relation")).toHaveAttribute(
    "data-target",
    "a",
  );
  await expect(
    card(page, "replacement").getByTestId("field-card-equip-relation"),
  ).toHaveCount(0);
  await page.evaluate(async () => {
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: posChange } = await import(
      "/src/service/duel/posChange.ts"
    );
    const { ygopro } = await import("/src/api/index.ts");
    const base = {
      card_info: {
        controller: 1,
        location: ygopro.CardZone.MZONE,
        sequence: 1,
      },
    };
    await posChange(getUIContainer(), {
      ...base,
      cur_position: ygopro.CardPosition.FACEDOWN_DEFENSE,
    });
    await posChange(getUIContainer(), {
      ...base,
      cur_position: ygopro.CardPosition.FACEUP_ATTACK,
    });
  });
  await expect(page.getByTestId("field-relation")).toHaveCount(0);
  await page.evaluate(() => window.__wire([93, 0, 8, 1, 1, 1, 4, 1, 1]));
  await expect(page.getByTestId("field-relation")).toHaveCount(1);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: move } = await import("/src/service/duel/move.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const source = cardStore.inner.find((c) => c.uuid === "a");
    await move(getUIContainer(), {
      code: source.code,
      from: source.location,
      to: new ygopro.CardLocation({
        controller: 0,
        zone: ygopro.CardZone.GRAVE,
        sequence: 0,
        position: ygopro.CardPosition.FACEUP_ATTACK,
      }),
      reason: 0,
    });
  });
  await expect(
    card(page, "equip").getByTestId("field-card-equip-relation"),
  ).toHaveCount(0);
  await expect(page.getByTestId("field-relation")).toHaveCount(0);
});

test("disconnect clears field selection without submitting and phase banners no longer duplicate top messages", async ({
  page,
}) => {
  await setup(page);
  await choose(page, "card", { ids: ["a", "b"] });
  await card(page, "a").click();
  await page.evaluate(async () => {
    const { resetDuelDialogs } = await import("/src/stores/duelDialogs.ts");
    resetDuelDialogs(true);
  });
  await expect(page.getByTestId("field-selection")).not.toBeVisible();
  await expect(card(page, "a")).toHaveAttribute("data-card-selected", "false");
  expect(await sent(page)).toEqual([]);
  await page.evaluate(async () => {
    const { default: handle } = await import("/src/service/duel/newPhase.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { ygopro } = await import("/src/api/index.ts");
    void handle(getUIContainer(), {
      phase_type: ygopro.StocGameMessage.MsgNewPhase.PhaseType.DRAW,
    });
  });
  await expect(page.getByTestId("duel-phase-banner")).toHaveAttribute(
    "data-phase",
    "DP",
  );
  await expect(page.locator(".ant-message-notice")).toHaveCount(0);
});

test("xyz materials stay attached to their own host without temporary field flights", async ({
  page,
}) => {
  await page.route("**/*.webp", (route) =>
    route.fulfill({
      path: "neos-assets/card_back.webp",
      contentType: "image/webp",
    }),
  );
  await setup(page);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const { eventbus, Task } = await import("/src/infra/index.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: move } = await import("/src/service/duel/move.ts");
    const { REASON_MATERIAL } = await import("/src/common.ts");
    cardStore.inner.push(window.__make("xyz", 8, 0, ygopro.CardZone.EXTRA));
    cardStore.inner.push(
      window.__make("other-xyz", 9, 0, ygopro.CardZone.EXTRA),
    );
    window.__moves = [];
    eventbus.on(Task.Move, ({ args }) => window.__moves.push(args[0]));
    window.__move = async (
      id,
      zone,
      sequence,
      overlayIndex = null,
      controller = 0,
    ) => {
      const target = cardStore.inner.find((c) => c.uuid === id);
      const message = new ygopro.StocGameMessage.MsgMove({
        code: target.code,
        from: new ygopro.CardLocation({
          zone: target.location.zone,
          controller: target.location.controller,
          sequence: target.location.sequence,
          position: target.location.position,
          is_overlay: target.location.is_overlay,
          overlay_sequence: target.location.overlay_sequence,
        }),
        to: new ygopro.CardLocation({
          zone: ygopro.CardZone[zone],
          controller,
          sequence,
          is_overlay: overlayIndex !== null,
          overlay_sequence: overlayIndex ?? 0,
          position: ygopro.CardPosition.FACEUP_ATTACK,
        }),
        reason: overlayIndex === null ? 0 : REASON_MATERIAL | 0x200000,
      });
      await move(getUIContainer(), message);
      return {
        zone: ygopro.CardZone[message.to.zone],
        sequence: message.to.sequence,
      };
    };
  });
  await expect(card(page, "xyz")).toBeVisible();
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__move("a", "EXTRA", 8, 0))).toEqual({
    zone: "EXTRA",
    sequence: 8,
  });
  await expect(card(page, "a")).toBeHidden();
  await page.evaluate(() => window.__move("b", "EXTRA", 8, 1));
  await page.evaluate(() => window.__move("c", "EXTRA", 9, 0));
  // An unrelated monster moving first must not consume pending materials.
  await page.evaluate(() => window.__move("d", "MZONE", 5));
  await expect(card(page, "a")).toHaveAttribute("data-card-zone", "EXTRA");
  await expect(card(page, "c")).toHaveAttribute("data-card-sequence", "9");
  await page.evaluate(async () => {
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    settingStore.animation.speed = 0;
    window.__moves = [];
    window.__summon = window.__move("xyz", "MZONE", 2);
  });
  await expect(card(page, "a")).toHaveAttribute(
    "data-card-overlay-animation",
    "summon",
  );
  await expect(card(page, "a")).toBeVisible();
  await expect(card(page, "b")).toHaveAttribute(
    "data-card-overlay-animation",
    "summon",
  );
  await expect(card(page, "a")).toHaveCSS("pointer-events", "none");
  await page.screenshot({ path: "/tmp/neos-xyz-insert.png" });
  await page.evaluate(() => window.__summon);
  expect(await page.evaluate(() => window.__moves.slice().sort())).toEqual([
    "a",
    "b",
    "xyz",
  ]);
  for (const id of ["a", "b"]) {
    await expect(card(page, id)).toHaveAttribute("data-card-zone", "MZONE");
    await expect(card(page, id)).toHaveAttribute("data-card-sequence", "2");
    await expect(card(page, id)).toBeHidden();
  }
  // Removing a host from Extra also reindexes the other host and its materials.
  await expect(card(page, "other-xyz")).toHaveAttribute(
    "data-card-sequence",
    "8",
  );
  await expect(card(page, "c")).toHaveAttribute("data-card-zone", "EXTRA");
  await expect(card(page, "c")).toHaveAttribute("data-card-sequence", "8");
  await page.evaluate(() => window.__move("other-xyz", "MZONE", 3));
  await expect(card(page, "c")).toHaveAttribute("data-card-sequence", "3");
  const materialTransform = await card(page, "b").evaluate(
    (el) => el.style.transform,
  );
  await page.waitForTimeout(350);
  expect(await card(page, "b").evaluate((el) => el.style.transform)).toBe(
    materialTransform,
  );
  // Detaching restores the card face, removes only that material and closes the index gap.
  await page.evaluate(() => window.__move("a", "GRAVE", 0));
  await expect(card(page, "a")).toBeVisible();
  await expect(card(page, "a")).toHaveAttribute(
    "data-card-is-overlay",
    "false",
  );
  await expect(card(page, "b")).toHaveAttribute(
    "data-card-overlay-sequence",
    "0",
  );
  await page.evaluate(async () => {
    window.__moves = [];
    const { eventbus, Task } = await import("/src/infra/index.ts");
    window.__overlayAnimations = [];
    eventbus.on(Task.Move, ({ args }) => {
      if (args[1]?.overlayAnimation)
        window.__overlayAnimations.push(args[1].overlayAnimation);
    });
    await window.__move("xyz", "MZONE", 4, null, 1);
  });
  expect(await page.evaluate(() => window.__overlayAnimations)).toEqual([]);
  await expect(card(page, "b")).toHaveAttribute("data-card-controller", "1");
  await expect(card(page, "b")).toHaveAttribute("data-card-sequence", "4");
  await expect(card(page, "c")).toHaveAttribute("data-card-controller", "0");
  await page.evaluate(() => window.__move("xyz", "GRAVE", 1));
  await expect(card(page, "b")).toBeHidden();
  await page.evaluate(() => window.__move("b", "GRAVE", 2));
  await expect(card(page, "b")).toBeVisible();
  // Adding material to a monster already on the field travels directly to that host.
  await page.evaluate(() => {
    window.__attach = window.__move("a", "MZONE", 3, 1);
  });
  await expect(card(page, "a")).toHaveAttribute(
    "data-card-overlay-animation",
    "attach",
  );
  await expect(card(page, "a")).toBeVisible();
  await page.evaluate(() => window.__attach);
  await expect(card(page, "a")).toBeHidden();
  // 关闭动画仍完成区域变更，不阻塞消息队列。
  await page.evaluate(async () => {
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    settingStore.saveAnimationConfig({ enabled: false });
  });
  await page.evaluate(() => window.__move("b", "MZONE", 3, 2));
  await expect(card(page, "b")).toHaveAttribute(
    "data-card-overlay-animation",
    "none",
  );
  await expect(card(page, "b")).toBeHidden();
});

test("overlay transfer during an xyz upgrade preserves source addresses until each move", async ({
  page,
}) => {
  await setup(page);
  const result = await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: move } = await import("/src/service/duel/move.ts");
    const { REASON_MATERIAL } = await import("/src/common.ts");
    const { MZONE, EXTRA } = ygopro.CardZone;
    const loc = (zone, sequence, overlayIndex = null) =>
      new ygopro.CardLocation({
        controller: 0,
        zone,
        sequence,
        position: ygopro.CardPosition.FACEUP_ATTACK,
        is_overlay: overlayIndex !== null,
        overlay_sequence: overlayIndex ?? 0,
      });
    const a = cardStore.inner.find((c) => c.uuid === "a");
    const b = cardStore.inner.find((c) => c.uuid === "b");
    b.location = loc(MZONE, 0, 0);
    const send = (from, to) =>
      move(
        getUIContainer(),
        new ygopro.StocGameMessage.MsgMove({
          code: a.code,
          from,
          to,
          reason: REASON_MATERIAL | 0x200000,
        }),
      );
    await send(loc(MZONE, 0), loc(EXTRA, 8, 0));
    const oldMaterialLocation = {
      zone: b.location.zone,
      sequence: b.location.sequence,
    };
    // The server still addresses the old material by the previous host's field location.
    await send(loc(MZONE, 0, 0), loc(EXTRA, 8, 1));
    return {
      oldZone: oldMaterialLocation.zone,
      expectedOldZone: MZONE,
      oldSequence: oldMaterialLocation.sequence,
      host: {
        zone: a.location.zone,
        overlay_sequence: a.location.overlay_sequence,
      },
      material: {
        zone: b.location.zone,
        sequence: b.location.sequence,
        overlay_sequence: b.location.overlay_sequence,
      },
      expectedZone: EXTRA,
    };
  });
  expect(result.oldZone).toBe(result.expectedOldZone);
  expect(result.oldSequence).toBe(0);
  expect(result.host.zone).toBe(result.expectedZone);
  expect(result.material.zone).toBe(result.expectedZone);
  expect(result.material.sequence).toBe(8);
  expect(result.host.overlay_sequence).toBe(0);
  expect(result.material.overlay_sequence).toBe(1);
  await expect(card(page, "a")).toBeHidden();
  await expect(card(page, "b")).toBeHidden();
});

test("generic FACEUP equipment and continuous targets stay visible across wire queries and position changes", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const equip = window.__make("faceup-equip", 0, 0, ygopro.CardZone.GRAVE);
    equip.meta.data.type = equip.originalData.type = 2 | 0x40000;
    const continuous = window.__make(
      "faceup-continuous",
      2,
      0,
      ygopro.CardZone.SZONE,
    );
    continuous.meta.data.type = continuous.originalData.type = 2 | 0x20000;
    continuous.location.position = ygopro.CardPosition.FACEUP;
    cardStore.inner.push(equip, continuous);
  });
  await expect(card(page, "faceup-equip")).toBeVisible();
  await page.waitForTimeout(400);
  await page.evaluate(async () => {
    // Real equipment messages use POS_FACEUP (0x05), not only POS_FACEUP_ATTACK (0x01).
    const code = new Uint8Array(4);
    new DataView(code.buffer).setUint32(0, 46986414, true);
    await window.__wire([50, ...code, 0, 16, 0, 1, 0, 8, 1, 5, 0, 0, 0, 0]);
    await window.__wire([93, 0, 8, 1, 5, 0, 4, 0, 1]);
    await window.__wire([96, 0, 8, 2, 5, 0, 8, 1, 5]);
  });
  const equip = card(page, "faceup-equip");
  await expect(equip).toHaveAttribute("data-card-position", "FACEUP");
  await expect(equip.getByTestId("field-card-spell-type")).toHaveAttribute(
    "data-kind",
    "equip",
  );
  await expect(equip.getByTestId("field-card-equip-relation")).toBeVisible();
  await expect(
    card(page, "a").getByTestId("field-card-equip-relation"),
  ).toBeVisible();
  await expect(equip.getByTestId("field-card-target-relation")).toHaveAttribute(
    "data-role",
    "target",
  );
  await expect(
    card(page, "faceup-continuous").getByTestId("field-card-target-relation"),
  ).toHaveAttribute("data-role", "source");
  await equip.getByTestId("field-card-equip-relation").click();
  await expect(page.getByTestId("field-relation")).toHaveCount(2);
  // Query position updates must not treat the generic face-up state as a face-down reset.
  await page.evaluate(async () => {
    await window.__query(0, 8, 1, 2, [0x01010800]);
    await window.__query(0, 8, 1, 2, [0x05010800]);
  });
  await expect(equip.getByTestId("field-card-equip-relation")).toBeVisible();
  await expect(equip.getByTestId("field-card-target-relation")).toBeVisible();
  await page.evaluate(async () => {
    const { default: posChange } = await import(
      "/src/service/duel/posChange.ts"
    );
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const card_info = {
      controller: 0,
      location: ygopro.CardZone.SZONE,
      sequence: 1,
    };
    await posChange(getUIContainer(), {
      card_info,
      cur_position: ygopro.CardPosition.FACEUP_ATTACK,
    });
    await posChange(getUIContainer(), {
      card_info,
      cur_position: ygopro.CardPosition.FACEUP,
    });
  });
  await expect(page.getByTestId("field-relation")).toHaveCount(2);
  await page.evaluate(() => window.__query(0, 8, 1, 2, [0x08010800]));
  await expect(equip.getByTestId("field-card-info")).toHaveCount(0);
  await expect(
    card(page, "a").getByTestId("field-card-equip-relation"),
  ).toHaveCount(0);
  await expect(
    card(page, "faceup-continuous").getByTestId("field-card-target-relation"),
  ).toHaveCount(0);
  await expect(page.getByTestId("field-relation")).toHaveCount(0);
});
