import { expect, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

import { clickCardAction } from "./helpers/live";

test.use({ viewport: { width: 1280, height: 1000 } });

let database: Buffer;
let preReleaseDatabase: Buffer;
test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER, alias INTEGER DEFAULT 0); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
  );
  preReleaseDatabase = Buffer.from(db.export());
  for (const code of Array.from(
    { length: 12 },
    (_, index) => 1000001 + index,
  )) {
    db.run("INSERT INTO datas (id, type) VALUES (?, 33)", [code]);
    db.run("INSERT INTO texts VALUES (?, ?, ?)", [
      code,
      `候选 ${code}`,
      `候选 ${code} 的效果文本`,
    ]);
  }
  db.run("INSERT INTO datas (id, type) VALUES (1000020, 16385)");
  db.run("INSERT INTO texts VALUES (1000020, '候选衍生物', '')");
  db.run("ALTER TABLE texts ADD COLUMN str1 TEXT");
  db.run("ALTER TABLE texts ADD COLUMN str2 TEXT");
  // 两张卡的可发动效果都使用 Stringid(cardId, 1)，描述来源由完整编号区分。
  for (const [code, effect] of [
    [92472273, "特殊召唤"],
    [68831625, "破坏卡片并提升攻击力"],
  ] as const) {
    db.run("INSERT INTO datas (id, type) VALUES (?, 33)", [code]);
    db.run("INSERT INTO texts (id, name, desc, str2) VALUES (?, ?, ?, ?)", [
      code,
      `卡片 ${code}`,
      effect,
      effect,
    ]);
  }
  database = Buffer.from(db.export());
  db.close();
});

async function setup(page: Page) {
  await page.route("**/ygopro-super-pre/data/version.txt", (route) =>
    route.fulfill({ body: "1792173550" }),
  );
  await page.route(/\.cdb(?:\?.*)?$/, (route) =>
    route.fulfill({
      body: route.request().url().includes("test-release.cdb")
        ? preReleaseDatabase
        : database,
    }),
  );
  await page.route("**/*.conf", (route) =>
    route.fulfill({
      body: "!system 212 已选择的卡\n!system 1211 确认\n!system 1295 取消\n!system 1004 墓地",
    }),
  );
  await page.route(/\/test-release-v2\.json(?:\?.*)?$/, (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route(/\/\d+\.webp(?:\?.*)?$/, (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="438"><rect width="300" height="438" fill="gray"/></svg>',
    }),
  );
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

for (const command of ["idle", "battle"] as const) {
  test(`${command} activation distinguishes a card's own effect from a granted effect`, async ({
    page,
  }) => {
    await setup(page);
    await page.evaluate(async (command) => {
      const { fetchCard, ygopro } = await import("/src/api/index.ts");
      const { cardStore } = await import("/src/stores/index.ts");
      const { getUIContainer } = await import("/src/container/compat.ts");
      const { genCard } = await import("/src/service/utils/genCard.ts");
      cardStore.inner = [
        genCard({
          uuid: "granted-effect",
          code: 92472273,
          meta: fetchCard(92472273),
          location: new ygopro.CardLocation({
            controller: 0,
            zone: ygopro.CardZone.MZONE,
            sequence: 0,
            position: ygopro.CardPosition.FACEUP_ATTACK,
          }),
          counters: {},
          idleInteractivities: [],
          selectInfo: { selectable: false, selected: false },
          status: 0,
          isToken: false,
          targeted: false,
        }),
      ];
      const u32 = (value: number) => {
        const bytes = new Uint8Array(4);
        new DataView(bytes.buffer).setUint32(0, value, true);
        return [...bytes];
      };
      // 装备卡赋予的效果仍由 92472273 发动，描述编号引用 68831625。
      const effects = [92472273, 68831625].flatMap((code) => [
        ...u32(92472273),
        0,
        4,
        0,
        ...u32(code * 16 + 1),
      ]);
      if (command === "idle") {
        const { default: parse } = await import(
          "/src/api/ocgcore/ocgAdapter/stoc/stocGameMsg/selectIdleCmd.ts"
        );
        const { default: handle } = await import(
          "/src/service/duel/selectIdleCmd.ts"
        );
        await handle(
          getUIContainer(),
          parse(new Uint8Array([0, 0, 0, 0, 0, 0, 2, ...effects, 0, 1, 0])),
        );
      } else {
        const { default: parse } = await import(
          "/src/api/ocgcore/ocgAdapter/stoc/stocGameMsg/selectBattleCmd.ts"
        );
        const { default: handle } = await import(
          "/src/service/duel/selectBattleCmd.ts"
        );
        await handle(
          getUIContainer(),
          parse(new Uint8Array([0, 2, ...effects, 0, 0, 1])),
        );
      }
    }, command);
    await page
      .locator('[data-testid="duel-card"][data-card-code="92472273"]')
      .click();
    await page.getByTestId("duel-action-activate").click();
    const options = page.getByTestId("duel-option-item");
    await expect(options).toHaveText(["特殊召唤", "破坏卡片并提升攻击力"]);
    await options.last().dblclick();
    await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
    expect(await page.evaluate(() => window.__sent[0].slice(-4))).toEqual([
      command === "idle" ? 5 : 0,
      0,
      1,
      0,
    ]);
  });
}

test("chain choices describe granted effects while retaining the activating card and response", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { matStore, ChainSetting } = await import("/src/stores/index.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: parse } = await import(
      "/src/api/ocgcore/ocgAdapter/stoc/stocGameMsg/selectChain.ts"
    );
    const { default: handle } = await import(
      "/src/service/duel/selectChain.ts"
    );
    matStore.chainSetting = ChainSetting.CHAIN_AVAILABLE;
    const u32 = (value: number) => {
      const bytes = new Uint8Array(4);
      new DataView(bytes.buffer).setUint32(0, value, true);
      return [...bytes];
    };
    const effects = [92472273, 68831625].flatMap((code) => [
      0,
      0,
      ...u32(92472273),
      0,
      4,
      0,
      1,
      ...u32(code * 16 + 1),
    ]);
    void handle(
      getUIContainer(),
      parse(new Uint8Array([0, 2, 0, ...u32(0), ...u32(0), ...effects])),
    );
  });
  const options = page.getByTestId("duel-select-card-option");
  await expect(options).toHaveCount(2);
  await expect(options.first()).toHaveAttribute("data-card-code", "92472273");
  await expect(options.last()).toHaveAttribute("data-card-code", "92472273");
  await options.first().hover();
  await expect(page.getByRole("tooltip")).toHaveText("特殊召唤");
  await options.last().hover();
  await expect(
    page.getByRole("tooltip", { name: "破坏卡片并提升攻击力", exact: true }),
  ).toBeVisible({ timeout: 3000 });
  await options.last().dblclick();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
  expect(await page.evaluate(() => window.__sent[0].slice(-4))).toEqual([
    1, 0, 0, 0,
  ]);
});

test("all effect options remain accessible and reopening with fewer options resets selection", async ({
  page,
}) => {
  await setup(page);
  async function openOptions(count: number) {
    await page.evaluate(async (count) => {
      const { displayOptionModal } = await import(
        "/src/ui/Duel/Message/index.ts"
      );
      void displayOptionModal(
        "请选择要发动或处理的效果",
        Array.from({ length: count }, (_, response) => ({
          info: `效果选择 ${response + 1}：将所选卡片加入手牌`,
          response,
        })),
        1,
      );
    }, count);
  }
  await openOptions(24);
  const surface = page.getByTestId("duel-option-modal");
  const options = surface.getByTestId("duel-option-item");
  const submit = page.getByTestId("duel-option-submit");
  await expect(options).toHaveCount(24);
  await expect(surface.locator(".ant-segmented, .ant-pagination")).toHaveCount(
    0,
  );
  await expect
    .poll(() =>
      surface
        .locator("[data-overlayscrollbars-viewport]")
        .evaluate((node) => node.scrollHeight > node.clientHeight),
    )
    .toBe(true);
  await options.last().dblclick();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
  expect(await page.evaluate(() => window.__sent[0].slice(-4))).toEqual([
    23, 0, 0, 0,
  ]);
  await expect(
    page.locator('[data-testid="duel-option-modal"]:visible'),
  ).toHaveCount(0);

  await openOptions(2);
  await expect(options).toHaveCount(2);
  await expect(surface.locator(".ant-pro-checkcard-checked")).toHaveCount(0);
  await expect(submit).toBeDisabled();
  await options.first().click();
  await expect(submit).toBeEnabled();
  await options.last().click();
  await expect(submit).toBeEnabled();
  await expect(surface.locator(".ant-pro-checkcard-checked")).toHaveCount(1);
  await expect(
    options.first().locator(".ant-pro-checkcard-checked"),
  ).toHaveCount(0);
  await expect(
    options.last().locator(".ant-pro-checkcard-checked"),
  ).toHaveCount(1);
  await options.first().click();
  await expect(submit).toBeEnabled();
  await expect(
    options.last().locator(".ant-pro-checkcard-checked"),
  ).toHaveCount(0);
  await submit.click();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(2);
  // 第一个选项的协议值为 0，仍应作为有效选择发送。
  expect(await page.evaluate(() => window.__sent[1].slice(-4))).toEqual([
    0, 0, 0, 0,
  ]);
});

test("multi-option choices combine bit masks across the full list", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { displayOptionModal } = await import(
      "/src/ui/Duel/Message/index.ts"
    );
    void displayOptionModal(
      "请选择两个属性",
      Array.from({ length: 12 }, (_, index) => ({
        info: `属性 ${index + 1}`,
        response: 1 << index,
      })),
      2,
    );
  });
  const options = page.getByTestId("duel-option-item");
  const submit = page.getByTestId("duel-option-submit");
  await expect(options).toHaveCount(12);
  await options.first().click();
  await expect(submit).toBeDisabled();
  await options.last().click();
  await expect(submit).toBeEnabled();
  await options.nth(1).click();
  await expect(submit).toBeDisabled();
  await options.nth(1).click();
  await submit.click();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
  expect(await page.evaluate(() => window.__sent[0].slice(-4))).toEqual([
    1, 8, 0, 0,
  ]);
});

test("card declaration shows every result without pagination and keeps declaration constraints", async ({
  page,
}) => {
  await setup(page);
  async function search(opcodes: number[]) {
    await page.evaluate(async (opcodes) => {
      const { displayAnnounceModal } = await import(
        "/src/ui/Duel/Message/index.ts"
      );
      void displayAnnounceModal(opcodes);
    }, opcodes);
    await page.getByTestId("duel-announce-search").fill("候选");
    await page.getByTestId("duel-announce-search-submit").click();
  }
  await search([1]);
  const surface = page.getByTestId("duel-announce-modal");
  const results = surface.getByTestId("duel-announce-card-option");
  const submit = page.getByTestId("duel-announce-submit");
  await expect(results).toHaveCount(12);
  await expect(surface.locator(".ant-pagination")).toHaveCount(0);
  await results.last().getByRole("checkbox").check();
  await expect(submit).toBeEnabled();
  await page.getByTestId("duel-announce-name-only").check();
  await expect(submit).toBeDisabled();
  await expect(results).toHaveCount(12);
  await surface
    .locator('[data-card-code="1000012"]')
    .getByRole("checkbox")
    .check();
  await submit.click();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
  expect(await page.evaluate(() => window.__sent[0].slice(-4))).toEqual([
    76, 66, 15, 0,
  ]);
  await expect(
    page.locator('[data-testid="duel-announce-modal"]:visible'),
  ).toHaveCount(0);

  await search([1000001, 0x40000100]);
  await expect(results).toHaveCount(1);
  await expect(results.first()).toHaveAttribute("data-card-code", "1000001");
  await expect(submit).toBeDisabled();
  await results.first().getByRole("checkbox").check();
  await submit.click();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(2);
  expect(await page.evaluate(() => window.__sent[1].slice(-4))).toEqual([
    65, 66, 15, 0,
  ]);
});

for (const kind of ["yesno", "position", "option", "announce"] as const) {
  test(`${kind} retains its choice after an offline send and completes once on retry`, async ({
    page,
  }, info) => {
    await setup(page);
    await page.evaluate(async (kind) => {
      const dialogs = await import("/src/ui/Duel/Message/index.ts");
      const { ygopro } = await import("/src/api/index.ts");
      window.__choiceDone = false;
      const pending =
        kind === "yesno"
          ? dialogs.displayYesNoModal("离线重试")
          : kind === "position"
          ? dialogs.displayPositionModal(
              [
                ygopro.CardPosition.FACEUP_ATTACK,
                ygopro.CardPosition.FACEUP_DEFENSE,
                ygopro.CardPosition.FACEDOWN_DEFENSE,
              ],
              1000001,
            )
          : kind === "option"
          ? dialogs.displayOptionModal(
              "离线重试",
              [{ info: "选项", response: 7 }],
              1,
            )
          : dialogs.displayAnnounceModal([1]);
      void pending.then(() => {
        window.__choiceDone = true;
      });
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: false,
      });
    }, kind);
    const surface =
      kind === "yesno"
        ? page
            .locator(".ant-modal:visible")
            .filter({ has: page.getByTestId("duel-yesno-modal") })
        : page.locator(`[data-testid="duel-${kind}-modal"]:visible`);
    if (kind === "position") {
      await expect(surface).toBeVisible();
      console.log(
        "Position card sizes:",
        await surface.locator("img").evaluateAll((images) =>
          images.map((image) => {
            const style = getComputedStyle(image);
            return { width: style.width, height: style.height };
          }),
        ),
      );
      await page.screenshot({ path: info.outputPath("position-desktop.png") });
      await page.setViewportSize({ width: 375, height: 812 });
      await expect
        .poll(() =>
          surface.evaluate((element) => {
            const rect = element.closest(".ant-modal")!.getBoundingClientRect();
            return rect.left >= 0 && rect.right <= innerWidth;
          }),
        )
        .toBe(true);
      await page.screenshot({ path: info.outputPath("position-mobile.png") });
    }
    if (kind === "option")
      await surface.getByTestId("duel-option-item").click();
    if (kind === "announce") {
      await page.getByTestId("duel-announce-search").fill("候选");
      await page.getByTestId("duel-announce-search-submit").click();
      await surface
        .getByTestId("duel-announce-card-option")
        .first()
        .getByRole("checkbox")
        .check();
    }
    const submit =
      kind === "yesno"
        ? page.getByTestId("duel-yesno-yes")
        : kind === "position"
        ? page.getByTestId("duel-position-option").last()
        : page.getByTestId(`duel-${kind}-submit`);
    await submit.click();
    await expect(surface).toBeVisible();
    expect(
      await page.evaluate(() => ({
        done: window.__choiceDone,
        sent: window.__sent.length,
      })),
    ).toEqual({ done: false, sent: 0 });
    if (kind === "announce") {
      await expect(page.getByTestId("duel-announce-search")).toHaveValue(
        "候选",
      );
      await expect(submit).toBeEnabled();
    }
    await page.evaluate(async () => {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: true,
      });
      const { connectionStore } = await import(
        "/src/stores/connectionStore.ts"
      );
      connectionStore.offline = false;
    });
    await submit.click();
    await expect(surface).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => window.__choiceDone))
      .toBe(true);
    expect(await page.evaluate(() => window.__sent.length)).toBe(1);
  });
}

test("single-option choices remain retryable if sending is rejected", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { default: handle } = await import(
      "/src/service/duel/selectOption.ts"
    );
    const { getUIContainer } = await import("/src/container/compat.ts");
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    void handle(getUIContainer(), { options: [{ code: 0, response: 7 }] });
  });
  await expect(page.getByTestId("duel-option-modal")).toBeVisible();
  await page.getByTestId("duel-option-item").dblclick();
  await expect(page.getByTestId("duel-option-modal")).toBeVisible();
  expect(await page.evaluate(() => window.__sent.length)).toBe(0);
  await page.evaluate(async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    const { connectionStore } = await import("/src/stores/connectionStore.ts");
    connectionStore.offline = false;
  });
  await page.getByTestId("duel-option-item").dblclick();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
  expect(await page.evaluate(() => window.__sent[0].slice(-4))).toEqual([
    7, 0, 0, 0,
  ]);
});

for (const [zone, source, command] of [
  ["EXTRA", "idle", "sp_summon"],
  ["GRAVE", "idle", "activate"],
  ["REMOVED", "idle", "activate"],
  ["GRAVE", "battle", "activate"],
  ["REMOVED", "battle", "activate"],
] as const) {
  test(`single candidate ${zone} ${source} ${command} shows only the card image before responding`, async ({
    page,
  }, info) => {
    await setup(page);
    await page.evaluate(
      async ({ zone, source, command }) => {
        const { fetchCard, ygopro } = await import("/src/api/index.ts");
        const { cardStore } = await import("/src/stores/index.ts");
        const { getUIContainer } = await import("/src/container/compat.ts");
        const { genCard } = await import("/src/service/utils/genCard.ts");
        const { openActiveActions } = await import(
          "/src/service/duel/activeActions.ts"
        );
        // 区域里保留另一张卡，验证判断依据是操作候选数。
        cardStore.inner = [92472273, 1000001].map((code, sequence) =>
          genCard({
            uuid: `single-action-${sequence}`,
            code,
            meta: fetchCard(code),
            location: new ygopro.CardLocation({
              controller: 0,
              zone: ygopro.CardZone[zone],
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
        const data = {
          card_info: new ygopro.CardInfo({
            location: ygopro.CardZone[zone],
            sequence: 0,
          }),
          effect_description: command === "activate" ? 68831625 * 16 + 1 : 0,
          response: source === "battle" ? 0 : command === "sp_summon" ? 1 : 5,
        };
        if (source === "idle") {
          const G = ygopro.StocGameMessage.MsgSelectIdleCmd;
          openActiveActions(getUIContainer(), {
            source,
            message: new G({
              player: 0,
              enable_ep: true,
              idle_cmds: [
                new G.IdleCmd({
                  idle_type:
                    command === "sp_summon"
                      ? G.IdleCmd.IdleType.SPSUMMON
                      : G.IdleCmd.IdleType.ACTIVATE,
                  idle_datas: [new G.IdleCmd.IdleData(data)],
                }),
              ],
            }),
          });
        } else {
          const G = ygopro.StocGameMessage.MsgSelectBattleCmd;
          openActiveActions(getUIContainer(), {
            source,
            message: new G({
              player: 0,
              enable_ep: true,
              battle_cmds: [
                new G.BattleCmd({
                  battle_type: G.BattleCmd.BattleType.ACTIVATE,
                  battle_datas: [new G.BattleCmd.BattleData(data)],
                }),
              ],
            }),
          });
        }
      },
      { zone, source, command },
    );
    const pile = page.getByTestId("duel-card").last();
    await clickCardAction(page, pile, command);
    const modal = page.locator(
      '[data-testid="duel-select-cards-modal"]:visible',
    );
    const option = modal.getByTestId("duel-select-card-option");
    await expect(option).toHaveAttribute("data-card-code", "92472273");
    await expect(option.locator("img")).toBeVisible();
    await expect(option.locator("img")).toHaveAttribute(
      "src",
      /\/92472273\.webp(?:\?.*)?$/,
    );
    await expect(modal).not.toContainText("卡片 92472273");
    await expect(modal).not.toContainText("破坏卡片并提升攻击力");
    expect(await page.evaluate(() => window.__sent)).toEqual([]);
    if (zone === "EXTRA") {
      await expect(page.locator(".ant-modal").filter({ has: modal })).toHaveCSS(
        "opacity",
        "1",
      );
      await page.screenshot({
        path: info.outputPath("single-summon.png"),
        animations: "disabled",
      });
    }
    await page.getByTestId("duel-select-card-cancel").click();
    await expect(modal).toHaveCount(0);
    expect(await page.evaluate(() => window.__sent)).toEqual([]);
    await clickCardAction(page, pile, command);
    const submit = page.getByTestId("duel-select-card-submit");
    await expect(option.locator(".ant-pro-checkcard")).toHaveClass(/checked/);
    await expect(submit).toBeEnabled();
    await option.click();
    await expect(submit).toBeDisabled();
    await expect(option.locator(".ant-pro-checkcard")).not.toHaveClass(
      /checked/,
    );
    await option.click();
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
    expect(await page.evaluate(() => window.__sent[0].slice(-4))).toEqual([
      source === "battle" ? 0 : command === "sp_summon" ? 1 : 5,
      0,
      0,
      0,
    ]);
  });
}

test("a single effect option displays its source and description until confirmed", async ({
  page,
}, info) => {
  await setup(page);
  await page.evaluate(async () => {
    const { default: handle } = await import(
      "/src/service/duel/selectOption.ts"
    );
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { matStore } = await import("/src/stores/index.ts");
    matStore.hint.esHint = "卡片 92472273 发动时";
    void handle(getUIContainer(), {
      options: [{ code: 68831625 * 16 + 1, response: 7 }],
    });
  });
  const modal = page.getByTestId("duel-option-modal");
  await expect(modal).toBeVisible();
  await expect(modal).toContainText("卡片 92472273 发动时");
  await expect(modal.getByTestId("duel-option-card")).toHaveAttribute(
    "data-card-code",
    "68831625",
  );
  await expect(modal).toContainText("卡片 68831625");
  await expect(modal).toContainText("破坏卡片并提升攻击力");
  expect(await page.evaluate(() => window.__sent)).toEqual([]);
  await page.screenshot({
    path: info.outputPath("single-effect-option.png"),
    animations: "disabled",
  });
  await modal.getByTestId("duel-option-item").click();
  await page.getByTestId("duel-option-submit").click();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
  expect(await page.evaluate(() => window.__sent[0].slice(-4))).toEqual([
    7, 0, 0, 0,
  ]);
});

test("a single forced effect displays only the activating card image without a decline action", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { ChainSetting, matStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: handle } = await import(
      "/src/service/duel/selectChain.ts"
    );
    matStore.chainSetting = ChainSetting.CHAIN_IGNORE;
    void handle(getUIContainer(), {
      special_count: 0,
      hint0: 0,
      hint1: 0,
      chains: [
        {
          code: 92472273,
          effect_description: 68831625 * 16 + 1,
          forced: true,
          response: 7,
          location: new ygopro.CardLocation({
            controller: 0,
            zone: ygopro.CardZone.GRAVE,
            sequence: 0,
          }),
        },
      ],
    });
  });
  const modal = page.getByTestId("duel-select-cards-modal");
  const option = modal.getByTestId("duel-select-card-option");
  await expect(option).toHaveAttribute("data-card-code", "92472273");
  await expect(option.locator("img")).toBeVisible();
  await expect(option.locator("img")).toHaveAttribute(
    "src",
    /\/92472273\.webp(?:\?.*)?$/,
  );
  await expect(modal).not.toContainText("卡片 92472273");
  await expect(modal).not.toContainText("破坏卡片并提升攻击力");
  await expect(page.getByTestId("duel-select-card-cancel")).toHaveCount(0);
  expect(await page.evaluate(() => window.__sent)).toEqual([]);
  await expect(option.locator(".ant-pro-checkcard")).toHaveClass(/checked/);
  await expect(page.getByTestId("duel-select-card-submit")).toBeEnabled();
  await page.getByTestId("duel-select-card-submit").click();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
  expect(await page.evaluate(() => window.__sent[0].slice(-4))).toEqual([
    7, 0, 0, 0,
  ]);
});

test("deck selection previews revealed cards while preserving hidden board data", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { fetchCard, ygopro } = await import("/src/api/index.ts");
    const { cardStore } = await import("/src/stores/index.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: selectCard } = await import(
      "/src/service/duel/selectCard.ts"
    );
    cardStore.inner = [0, 1000003].map((code, sequence) => ({
      uuid: `deck-preview-${sequence}`,
      code,
      meta: fetchCard(code),
      location: new ygopro.CardLocation({
        controller: 0,
        zone: ygopro.CardZone.DECK,
        sequence,
        position: ygopro.CardPosition.FACEDOWN_DEFENSE,
      }),
      counters: {},
      idleInteractivities: [],
      selectInfo: { selectable: false, selected: false },
      status: 0,
      isToken: false,
      targeted: false,
    }));
    void selectCard(getUIContainer(), {
      cancelable: true,
      min: 1,
      max: 1,
      cards: [1000001, 1000002].map((code, response) => ({
        code,
        location: cardStore.inner[response].location,
        response,
      })),
    });
  });

  const options = page.getByTestId("duel-select-card-option");
  const detail = page.getByTestId("duel-card-detail");
  for (const [index, code] of [1000001, 1000002].entries()) {
    await options.nth(index).click();
    await expect(detail).toHaveAttribute("data-card-code", String(code));
    await expect(page.getByTestId("duel-card-name")).toContainText(
      `候选 ${code}`,
    );
    await expect(detail).toContainText(`候选 ${code} 的效果文本`);
  }
  expect(
    await page.evaluate(async () => {
      const { cardStore } = await import("/src/stores/index.ts");
      return cardStore.inner.map((card) => [card.code, card.meta.id]);
    }),
  ).toEqual([
    [0, 0],
    [1000003, 1000003],
  ]);
  await page.locator('[data-testid="duel-select-card-submit"]:visible').click();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
  expect(await page.evaluate(() => window.__sent[0].slice(3))).toEqual([1, 1]);
});

test("counter allocation keeps untouched cards at zero and resets on reopening", async ({
  page,
}) => {
  await setup(page);
  async function openCounter() {
    await page.evaluate(async () => {
      const { displayCheckCounterModal } = await import(
        "/src/ui/Duel/Message/index.ts"
      );
      void displayCheckCounterModal({
        min: 1,
        counterType: 1,
        options: [
          { code: 1000001, max: 2 },
          { code: 1000002, max: 2 },
        ],
      });
    });
  }
  const surface = page.locator(
    '[data-testid="duel-movable-selection"]:visible',
  );
  const inputs = surface.getByRole("spinbutton");
  const finish = surface.getByRole("button", { name: "finish", exact: true });
  await openCounter();
  await expect(inputs).toHaveCount(2);
  await expect(finish).toBeDisabled();
  await inputs.first().fill("1");
  await inputs.first().press("Tab");
  await expect(inputs.last()).toHaveValue("0");
  await expect(finish).toBeEnabled();
  await finish.click();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
  expect(await page.evaluate(() => window.__sent[0].slice(3))).toEqual([
    1, 0, 0, 0,
  ]);
  await expect(surface).toHaveCount(0);

  await openCounter();
  await expect(inputs.first()).toHaveValue("0");
  await expect(inputs.last()).toHaveValue("0");
  await expect(finish).toBeDisabled();
  await inputs.last().fill("1");
  await inputs.last().press("Tab");
  await expect(finish).toBeEnabled();
  await finish.click();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(2);
  expect(await page.evaluate(() => window.__sent[1].slice(3))).toEqual([
    0, 0, 1, 0,
  ]);
});

test("incremental selection retains blue frames across requests and sends only the clicked card", async ({
  page,
}) => {
  await setup(page);
  async function openSelection(selected: number[]) {
    await page.evaluate(async (selected) => {
      const { ygopro } = await import("/src/api/index.ts");
      const { getUIContainer } = await import("/src/container/compat.ts");
      const { matStore } = await import("/src/stores/index.ts");
      const { default: selectUnselectCard } = await import(
        "/src/service/duel/selectUnselectCard.ts"
      );
      const candidates = [
        {
          code: 1000001,
          controller: 0,
          zone: ygopro.CardZone.GRAVE,
          sequence: 0,
        },
        {
          code: 1000001,
          controller: 0,
          zone: ygopro.CardZone.GRAVE,
          sequence: 1,
        },
        {
          code: 1000002,
          controller: 0,
          zone: ygopro.CardZone.REMOVED,
          sequence: 0,
        },
        {
          code: 1000001,
          controller: 1,
          zone: ygopro.CardZone.GRAVE,
          sequence: 0,
        },
        {
          code: 1000003,
          controller: 1,
          zone: ygopro.CardZone.REMOVED,
          sequence: 1,
        },
      ];
      const selectable = candidates
        .map((_, index) => index)
        .filter((index) => !selected.includes(index));
      const make = (index: number, response: number) => {
        const { code, ...location } = candidates[index];
        return { code, location: new ygopro.CardLocation(location), response };
      };
      matStore.hint.esSelectHint = "请选择要返回卡组的卡";
      void selectUnselectCard(getUIContainer(), {
        finishable: selected.length === 3,
        cancelable: true,
        min: 3,
        max: 3,
        selectable_cards: selectable.map((index, response) =>
          make(index, response),
        ),
        selected_cards: selected.map((index, response) =>
          make(index, selectable.length + response),
        ),
      });
    }, selected);
    await expect(surface).toBeVisible();
    await expect(options).toHaveCount(5);
    await expect(submit).toBeDisabled();
  }
  const surface = page.locator(
    '[data-testid="duel-select-cards-modal"]:visible',
  );
  const options = surface.getByTestId("duel-select-card-option");
  const submit = page.locator(
    '[data-testid="duel-select-card-submit"]:visible',
  );
  // 同名卡按控制者、区域和位置区分，避免一张卡选中后所有副本一起高亮。
  const ownGrave = (sequence: number) =>
    surface.locator(
      `[data-testid="duel-select-card-option"][data-card-controller="0"][data-card-zone="GRAVE"][data-card-sequence="${sequence}"]`,
    );
  const ownRemoved = surface.locator(
    '[data-testid="duel-select-card-option"][data-card-code="1000002"]',
  );
  const opponentGrave = surface.locator(
    '[data-testid="duel-select-card-option"][data-card-controller="1"][data-card-zone="GRAVE"]',
  );
  const expectSelected = async (selected: number[]) => {
    const identities = [ownGrave(0), ownGrave(1), ownRemoved, opponentGrave];
    for (const [index, option] of identities.entries()) {
      const card = option.locator(".ant-pro-checkcard");
      await expect
        .poll(() =>
          card.evaluate((node) =>
            getComputedStyle(node, "::before").boxShadow.includes(
              "rgb(0, 135, 230)",
            ),
          ),
        )
        .toBe(selected.includes(index));
    }
  };
  let responses = 0;
  const expectResponse = async (response: number[]) => {
    responses += 1;
    await expect
      .poll(() => page.evaluate(() => window.__sent.length))
      .toBe(responses);
    expect(await page.evaluate(() => window.__sent.at(-1).slice(3))).toEqual(
      response,
    );
    await expect(surface).toHaveCount(0);
  };

  await openSelection([]);
  await expect(surface.getByTestId("duel-select-card-group")).toHaveCount(2);
  await ownGrave(0).click();
  await submit.click();
  await expectResponse([1, 0]);

  await openSelection([0]);
  await expectSelected([0]);
  await ownRemoved.click();
  await submit.click();
  await expectResponse([1, 1]);

  await openSelection([0, 2]);
  await expectSelected([0, 2]);
  await opponentGrave.click();
  await submit.click();
  await expectResponse([1, 1]);

  await openSelection([0, 2, 3]);
  await expectSelected([0, 2, 3]);
  await expect(page.getByTestId("duel-select-card-finish")).toBeVisible();
  await ownGrave(0).click();
  await submit.click();
  await expectResponse([1, 2]);

  await openSelection([2, 3]);
  await expectSelected([2, 3]);
  await expect(page.getByTestId("duel-select-card-finish")).toHaveCount(0);
  await ownGrave(1).dblclick();
  await expectResponse([1, 1]);

  await openSelection([1, 2, 3]);
  await expectSelected([1, 2, 3]);
  await page.getByTestId("duel-select-card-finish").click();
  await expectResponse([255, 255, 255, 255]);

  await openSelection([]);
  await expectSelected([]);
  await page.locator('[data-testid="duel-select-card-cancel"]:visible').click();
  await expectResponse([255, 255, 255, 255]);
});

test("click sorting renumbers removed cards, supports reset and preserves original response indices", async ({
  page,
}) => {
  await setup(page);
  async function openSort(codes: number[]) {
    await page.evaluate(async (codes) => {
      const { default: sortCard } = await import(
        "/src/service/duel/sortCard.ts"
      );
      void sortCard({
        options: codes.map((code, response) => ({ code, response })),
      });
    }, codes);
  }
  await openSort([1000001, 1000002, 1000003]);
  const surface = page.locator(
    '[data-testid="duel-movable-selection"]:visible',
  );
  const cards = surface.getByTestId("duel-sort-card-option");
  const submit = surface.getByTestId("duel-sort-card-submit");
  const reset = surface.getByTestId("duel-sort-card-reset");
  const quick = surface.getByTestId("duel-sort-card-quick-select");
  await expect(cards).toHaveCount(3);
  await expect(submit).toBeDisabled();
  await expect(reset).toBeDisabled();
  await expect(quick).toBeEnabled();
  const footer = await Promise.all(
    [reset, quick, submit].map((button) => button.boundingBox()),
  );
  expect(footer[0]!.x).toBeLessThan(footer[1]!.x);
  expect(footer[1]!.x).toBeLessThan(footer[2]!.x);
  await cards.last().click();
  await expect(page.getByTestId("duel-card-detail")).toContainText(
    "候选 1000003 的效果文本",
  );
  await cards.first().click();
  await expect(submit).toBeDisabled();
  await cards.nth(1).click();
  await expect(submit).toBeEnabled();
  await cards.first().click();
  await expect(cards.first()).toHaveAttribute("aria-pressed", "false");
  await expect(cards.nth(1)).toHaveAttribute("data-card-order", "2");
  await expect(cards.last()).toHaveAttribute("data-card-order", "1");
  await expect(submit).toBeDisabled();
  await cards.first().click();
  await expect(cards.first()).toHaveAttribute("data-card-order", "3");
  await expect(submit).toBeEnabled();
  expect(await page.evaluate(() => window.__sent.length)).toBe(0);

  await reset.click();
  await expect(cards.first()).toHaveAttribute("aria-pressed", "false");
  await expect(cards.nth(1)).toHaveAttribute("aria-pressed", "false");
  await expect(cards.last()).toHaveAttribute("aria-pressed", "false");
  await expect(submit).toBeDisabled();
  await cards.last().focus();
  await cards.last().press("Enter");
  await cards.first().focus();
  await cards.first().press("Space");
  await cards.nth(1).click();
  await expect(cards.first()).toHaveAttribute("data-card-order", "2");
  await expect(cards.nth(1)).toHaveAttribute("data-card-order", "3");
  await expect(cards.last()).toHaveAttribute("data-card-order", "1");
  await submit.click();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
  expect(await page.evaluate(() => window.__sent[0].slice(3))).toEqual([
    1, 2, 0,
  ]);
  await expect(surface).toHaveCount(0);

  // 同名卡按候选序号独立排序，重新打开时清除上次编号。
  await openSort([1000001, 1000001]);
  await expect(cards).toHaveCount(2);
  await expect(submit).toBeDisabled();
  await expect(reset).toBeDisabled();
  await cards.last().click();
  await cards.first().click();
  await submit.click();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(2);
  expect(await page.evaluate(() => window.__sent[1].slice(3))).toEqual([1, 0]);

  // 未选择时按列表顺序提交，同名候选仍保留各自的位置；连续点击只响应一次。
  await openSort([1000001, 1000001, 1000002]);
  await expect(quick).toBeEnabled();
  await quick.evaluate((button) => {
    button.click();
    button.click();
  });
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(3);
  expect(await page.evaluate(() => window.__sent[2].slice(3))).toEqual([
    0, 1, 2,
  ]);
  await expect(surface).toHaveCount(0);

  // 手动选中的顺序作为前缀，快速选择只补齐剩余候选并立即确认。
  await openSort([1000001, 1000002, 1000003]);
  await cards.last().click();
  await quick.click();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(4);
  expect(await page.evaluate(() => window.__sent[3].slice(3))).toEqual([
    1, 2, 0,
  ]);
  await expect(surface).toHaveCount(0);
});

test("mobile sorting keeps every card clickable after opening the detail panel", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await page.evaluate(async () => {
    const { default: sortCard } = await import("/src/service/duel/sortCard.ts");
    void sortCard({
      options: Array.from({ length: 8 }, (_, response) => ({
        code: 1000001 + response,
        response,
      })),
    });
  });
  const cards = page.getByTestId("duel-sort-card-option");
  const submit = page.getByTestId("duel-sort-card-submit");
  await expect(cards).toHaveCount(8);
  const quick = page.getByTestId("duel-sort-card-quick-select");
  const quickBox = (await quick.boundingBox())!;
  const submitBox = (await submit.boundingBox())!;
  expect(quickBox.y).toBe(submitBox.y);
  expect(quickBox.x + quickBox.width).toBeLessThanOrEqual(submitBox.x);
  await cards.last().click();
  await expect(page.getByTestId("duel-card-detail")).toHaveAttribute(
    "data-card-code",
    "1000008",
  );
  await expect
    .poll(() =>
      page
        .locator(".ant-drawer-content-wrapper")
        .evaluate((node) => node.getBoundingClientRect().left),
    )
    .toBe(0);
  await cards.first().click();
  await expect(cards.first()).toHaveAttribute("data-card-order", "2");
  await expect(page.getByTestId("duel-card-detail")).toHaveAttribute(
    "data-card-code",
    "1000001",
  );
  for (const index of [1, 2, 3, 4, 5, 6]) await cards.nth(index).click();
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
  expect(await page.evaluate(() => window.__sent[0].slice(3))).toEqual([
    1, 2, 3, 4, 5, 6, 7, 0,
  ]);
});

test("sum popup displays locked mandatory cards and submits them once", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { ygopro } = await import("/src/api/index.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { default: selectSum } = await import(
      "/src/service/duel/selectSum.ts"
    );
    const make = (code: number, sequence: number, level1: number) => ({
      code,
      location: new ygopro.CardLocation({
        controller: 0,
        zone: ygopro.CardZone.GRAVE,
        sequence,
      }),
      level1,
      response: 0,
    });
    void selectSum(getUIContainer(), {
      overflow: 0,
      level_sum: 8,
      min: 1,
      max: 1,
      must_select_cards: [make(1000001, 0, 3)],
      selectable_cards: [make(1000002, 1, 5)],
    });
  });
  const surface = page.locator(
    '[data-testid="duel-select-cards-modal"]:visible',
  );
  const mandatory = surface.getByTestId("duel-select-card-mandatory-option");
  const submit = page.locator(
    '[data-testid="duel-select-card-submit"]:visible',
  );
  await expect(mandatory).toHaveCount(1);
  await expect(mandatory).toHaveAttribute("data-card-code", "1000001");
  await expect(mandatory.locator(".ant-pro-checkcard")).toHaveClass(/checked/);
  await expect(submit).toBeEnabled();
  await surface.getByTestId("duel-select-card-option").click();
  await expect(submit).toBeDisabled();
  await mandatory.click();
  await expect(mandatory.locator(".ant-pro-checkcard")).toHaveClass(/checked/);
  await expect(page.getByTestId("duel-card-detail")).toHaveAttribute(
    "data-card-code",
    "1000001",
  );
  await expect(submit).toBeDisabled();
  await expect(surface.getByTestId("duel-select-card-option")).toHaveCount(1);
  await surface.getByTestId("duel-select-card-option").click();
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
  // 必选项与可选项各有自己的序号，响应中各出现一次。
  expect(await page.evaluate(() => window.__sent[0].slice(3))).toEqual([
    2, 0, 0,
  ]);
});

async function openActivePrompt(
  page: Page,
  source: "idle" | "battle",
  multipleCards = false,
) {
  await page.evaluate(
    async ({ source, multipleCards }) => {
      const { fetchCard, ygopro } = await import("/src/api/index.ts");
      const { cardStore } = await import("/src/stores/index.ts");
      const { getUIContainer } = await import("/src/container/compat.ts");
      const { genCard } = await import("/src/service/utils/genCard.ts");
      const zone = multipleCards
        ? ygopro.CardZone.GRAVE
        : ygopro.CardZone.MZONE;
      const wireZone = multipleCards ? 16 : 4;
      cardStore.inner = Array.from(
        { length: multipleCards ? 2 : 1 },
        (_, sequence) =>
          genCard({
            uuid: `active-choice-${sequence}`,
            code: 92472273,
            meta: fetchCard(92472273),
            location: new ygopro.CardLocation({
              controller: 0,
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
      const u32 = (value: number) => {
        const bytes = new Uint8Array(4);
        new DataView(bytes.buffer).setUint32(0, value, true);
        return [...bytes];
      };
      const effect = (code: number) => [
        ...u32(92472273),
        0,
        wireZone,
        0,
        ...u32(code * 16 + 1),
      ];
      const cards = [0, 1].flatMap((sequence) => [
        ...u32(92472273),
        0,
        wireZone,
        sequence,
      ]);
      window.__activePrompt = async () => {
        if (source === "idle") {
          const { default: parse } = await import(
            "/src/api/ocgcore/ocgAdapter/stoc/stocGameMsg/selectIdleCmd.ts"
          );
          const { default: handle } = await import(
            "/src/service/duel/selectIdleCmd.ts"
          );
          const bytes = multipleCards
            ? [0, 0, 2, ...cards, 0, 0, 0, 0, 0, 1, 0]
            : [
                0,
                0,
                0,
                0,
                0,
                0,
                2,
                ...effect(92472273),
                ...effect(68831625),
                0,
                1,
                0,
              ];
          await handle(getUIContainer(), parse(new Uint8Array(bytes)));
        } else {
          const { default: parse } = await import(
            "/src/api/ocgcore/ocgAdapter/stoc/stocGameMsg/selectBattleCmd.ts"
          );
          const { default: handle } = await import(
            "/src/service/duel/selectBattleCmd.ts"
          );
          await handle(
            getUIContainer(),
            parse(
              new Uint8Array([
                0,
                2,
                ...effect(92472273),
                ...effect(68831625),
                0,
                0,
                1,
              ]),
            ),
          );
        }
      };
      await window.__activePrompt();
    },
    { source, multipleCards },
  );
}

for (const source of ["idle", "battle"] as const) {
  test(`${source} replacement cancels the old effect dialog and submits the current effect once`, async ({
    page,
  }) => {
    await setup(page);
    await openActivePrompt(page, source);
    const card = page
      .locator('[data-testid="duel-card"][data-card-code="92472273"]')
      .first();
    await expect(card).toHaveAttribute("data-card-idle-actions", /ACTIVATE/);
    await clickCardAction(page, card, "activate");
    const modal = page.getByTestId("duel-option-modal");
    await expect(modal).toBeVisible();
    const oldOption = await page
      .getByTestId("duel-option-item")
      .last()
      .elementHandle();
    await page.evaluate(() => window.__activePrompt());
    await expect(modal).not.toBeVisible();
    await oldOption?.evaluate((node) =>
      node.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })),
    );
    expect(await page.evaluate(() => window.__sent.length)).toBe(0);
    await expect(card).toHaveAttribute("data-card-idle-actions", /ACTIVATE/);
    await clickCardAction(page, card, "activate");
    await page.getByTestId("duel-option-item").last().dblclick();
    await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
    expect(await page.evaluate(() => window.__sent[0].slice(-4))).toEqual([
      source === "idle" ? 5 : 0,
      0,
      1,
      0,
    ]);
    await expect(modal).not.toBeVisible();
    await oldOption?.dispose();
  });
}

test("replacing an idle request closes a pending zone-card choice without responding", async ({
  page,
}) => {
  await setup(page);
  await openActivePrompt(page, "idle", true);
  const card = page
    .locator('[data-testid="duel-card"][data-card-code="92472273"]')
    .last();
  await expect(card).toHaveAttribute("data-card-idle-actions", /SP_SUMMON/);
  await clickCardAction(page, card, "sp_summon");
  const modal = page.locator('[data-testid="duel-select-cards-modal"]:visible');
  await expect(modal.getByTestId("duel-select-card-option")).toHaveCount(2);
  await page.evaluate(() => window.__activePrompt());
  await expect(modal).toHaveCount(0);
  expect(await page.evaluate(() => window.__sent.length)).toBe(0);
  await expect(card).toHaveAttribute("data-card-idle-actions", /SP_SUMMON/);
  await clickCardAction(page, card, "sp_summon");
  await modal.getByTestId("duel-select-card-option").last().dblclick();
  await expect.poll(() => page.evaluate(() => window.__sent.length)).toBe(1);
  expect(await page.evaluate(() => window.__sent[0].slice(-4))).toEqual([
    1, 0, 1, 0,
  ]);
});
