import { expect, type Page, test } from "@playwright/test";
import { collectPrivateActions } from "../../agent/src/duel/actions.ts";
import { observeDuel } from "../../agent/src/duel/observe.ts";

// Exercise the real UI and protocol adapters with a captured transport.
async function setup(page: Page) {
  await page.goto("/match");
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  await page.evaluate(async () => {
    const stores = await import("/src/stores/index.ts");
    const { initUIContainer } = await import("/src/container/compat.ts");
    const { ygopro } = await import("/src/api/index.ts");
    window.__packets = [];
    initUIContainer({
      isClosed: () => false,
      close: () => {},
      ws: {
        readyState: WebSocket.OPEN,
        send: (data: Uint8Array) => window.__packets.push([...data]),
      },
    });
    stores.deckStore.decks = [
      { deckName: "Deck A", main: [89631139], extra: [], side: [] },
      {
        deckName: "Deck B",
        main: [46986414],
        extra: [23995346],
        side: [15025844],
      },
    ];
    stores.deckStore.selectedDeckName = "Deck A";
    stores.roomStore.selfType = ygopro.StocTypeChange.SelfType.PLAYER1;
    stores.roomStore.players = [
      {
        name: "Me",
        isMe: true,
        state: ygopro.StocHsPlayerChange.State.NO_READY,
      },
      {
        name: "Opponent",
        isMe: false,
        state: ygopro.StocHsPlayerChange.State.NO_READY,
      },
    ];
    window.__phaseMessage = async (bytes: number[]) => {
      const { default: handle } = await import("/src/service/onSocketMessage.ts");
      const { getUIContainer } = await import("/src/container/compat.ts");
      const wire = new Uint8Array(bytes.length + 3);
      new DataView(wire.buffer).setUint16(0, bytes.length + 1, true);
      wire[2] = 1;
      wire.set(bytes, 3);
      await handle(getUIContainer(), new MessageEvent("message", {data: wire.buffer}));
    };
    stores.matStore.turnCount = 3;
    stores.matStore.selfType = 1;
    stores.matStore.currentPlayer = 0;
    stores.matStore.phase.currentPhase =
      ygopro.StocGameMessage.MsgNewPhase.PhaseType.MAIN1;
  });
}

async function navigate(page: Page, path: string) {
  await page.evaluate((path) => {
    history.pushState({}, "", path);
    dispatchEvent(new PopStateEvent("popstate"));
  }, path);
}

async function packets(page: Page) {
  return page.evaluate(() => window.__packets as number[][]);
}

test("searching the shared deck picker preserves selection in the room and sends the correct cards", async ({
  page,
}) => {
  await setup(page);
  const select = page.getByTestId("match-deck-select");
  await select.click();
  await expect(select.locator("input")).toBeEditable();
  await select.locator("input").fill("Deck B");
  await page.locator('.ant-select-item-option[title="Deck B"]').click();
  await navigate(page, "/waitroom");
  const roomSelect = page.getByTestId("waitroom-deck-select");
  await expect(roomSelect).toContainText("Deck B");
  await expect
    .poll(async () => (await packets(page)).filter((p) => p[2] === 2).length)
    .toBeGreaterThan(0);
  const updates = (await packets(page)).filter((p) => p[2] === 2);
  const data = new DataView(Uint8Array.from(updates.at(-1)!).buffer);
  expect(data.getUint32(3, true)).toBe(2);
  expect(data.getUint32(7, true)).toBe(1);
  expect(data.getUint32(11, true)).toBe(46986414);
  expect(data.getUint32(15, true)).toBe(23995346);
  expect(data.getUint32(19, true)).toBe(15025844);
  await roomSelect.click();
  await expect(roomSelect.locator("input")).toBeEditable();
  await roomSelect.locator("input").fill("Deck A");
  await page.locator('.ant-select-item-option[title="Deck A"]').click();
  await expect(roomSelect).toContainText("Deck A");
  await page.getByTestId("waitroom-ready-toggle").click();
  const sent = await packets(page);
  expect(sent.at(-1)![2]).toBe(0x22);
  expect(
    new DataView(Uint8Array.from(sent.at(-2)!).buffer).getUint32(11, true),
  ).toBe(89631139);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("side_deck")!).deckName,
    ),
  ).toBe("Deck A");
});

test("empty deck list does not crash the room or send a ready packet", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { deckStore } = await import("/src/stores/index.ts");
    deckStore.decks = [];
  });
  await navigate(page, "/waitroom");
  await page.getByTestId("waitroom-ready-toggle").click();
  await expect(page.getByText("请先选择卡组")).toBeVisible();
  expect(await packets(page)).toEqual([]);
});

test("rock, scissors and paper use the server's wire values and display each player's result", async ({
  page,
}) => {
  await setup(page);
  await navigate(page, "/waitroom");
  await expect(page.getByTestId("waitroom-ready-toggle")).toBeVisible();
  for (const [mora, wire, opponent] of [
    ["rock", 2, "scissors"],
    ["scissors", 1, "paper"],
    ["paper", 3, "rock"],
  ] as const) {
    await page.evaluate(async () => {
      const { eventbus, Task } = await import("/src/infra/index.ts");
      eventbus.emit(Task.Mora);
    });
    await page.getByTestId(`waitroom-mora-${mora}`).click();
    expect((await packets(page)).at(-1)!.slice(2)).toEqual([3, wire]);
    await page.evaluate(
      async ({ wire, other }) => {
        const { default: Adapter } = await import(
          "/src/api/ocgcore/ocgAdapter/stoc/stocHandResult.ts"
        );
        const { default: handleResult } = await import(
          "/src/service/room/handResult.ts"
        );
        const { getUIContainer } = await import("/src/container/compat.ts");
        const msg = new Adapter({
          exData: new Uint8Array([wire, other]),
        }).upcast();
        handleResult(getUIContainer(), msg);
      },
      { wire, other: { scissors: 1, rock: 2, paper: 3 }[opponent] },
    );
    await expect(
      page
        .getByTestId("waitroom-player-me")
        .getByTestId("waitroom-mora-result"),
    ).toHaveAttribute("data-hand", mora);
    await expect(
      page
        .getByTestId("waitroom-player-op")
        .getByTestId("waitroom-mora-result"),
    ).toHaveAttribute("data-hand", opponent);
  }
});

test("field controls follow the EX zone and own deck across viewport sizes and remain operable", async ({
  page,
}, testInfo) => {
  await setup(page);
  await navigate(page, "/duel");
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    cardStore.inner = [0, 1]
      .flatMap((controller) => [
        {
          controller,
          zone: ygopro.CardZone.MZONE,
          sequence: 2,
          position: ygopro.CardPosition.FACEUP_DEFENSE,
        },
        {
          controller,
          zone: ygopro.CardZone.DECK,
          sequence: 0,
          position: ygopro.CardPosition.FACEDOWN_ATTACK,
        },
      ])
      .map((location, index) => ({
        uuid: `fixture-${index}`,
        code: 46986414,
        location: new ygopro.CardLocation(location),
        meta: {
          id: 46986414,
          data: { atk: 2500, def: 2100, type: 1 },
          text: { name: "黑魔术师" },
        },
        counters: {},
        idleInteractivities: [],
        isToken: false,
        targeted: false,
        selectInfo: { selectable: false, selected: false },
        status: 0,
      }));
  });
  for (const [controller, angle] of [
    [0, -90],
    [1, 90],
  ]) {
    await expect(
      page.locator(
        `[data-testid="duel-card"][data-card-zone="MZONE"][data-card-controller="${controller}"]`,
      ),
    ).toHaveAttribute("style", new RegExp(`rotateZ\\(${angle}deg\\)`));
  }
  const phase = page.getByTestId("duel-phase-select");
  const chain = page.getByTestId("duel-chain-setting");
  await expect(phase).toBeVisible();
  for (const size of [
    { width: 1440, height: 1000 },
    { width: 1000, height: 620 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    const ex = page.locator(
      '[data-testid="duel-zone"][data-zone="MZONE"][data-sequence="6"]',
    );
    const deck = page.locator(
      '[data-testid="duel-zone"][data-zone="DECK"][data-controller="0"]',
    );
    await expect
      .poll(async () => {
        const a = (await phase.boundingBox())!;
        const b = (await ex.boundingBox())!;
        const c = (await chain.boundingBox())!;
        const d = (await deck.boundingBox())!;
        const outside = (await page.locator('[data-testid="duel-zone"][data-zone="REMOVED"][data-controller="0"]').boundingBox())!;
        const scale = b.width / 120;
        return (
          a.x > b.x + b.width &&
          Math.abs(a.y + a.height / 2 + 3.5 * scale - b.y - b.height / 2) < 1 &&
          Math.abs(a.x + a.width / 2 - (b.x + b.width + outside.x) / 2) < 1 &&
          c.x + c.width / 2 > d.x + d.width / 2 &&
          c.y + c.height / 2 < d.y &&
          c.x + c.width <= size.width &&
          c.y >= 0 &&
          Math.abs(c.width - c.height) < 1
        );
      })
      .toBe(true);
    await expect(chain).toHaveCSS("border-radius", "50%");
    await chain.click();
    await page.getByTestId("duel-chain-setting-all").click();
    await expect(chain).toHaveAttribute("data-chain-setting", "all");
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.__phaseMessage([11,0,0,0,0,0,0,0,1,1,0]));
  await phase.click();
  await expect(page.getByTestId("duel-phase-picker")).toBeVisible();
  await expect(page.getByRole("dialog", {name: "选择阶段"})).toHaveCSS("transform", "none");
  await page.screenshot({ path: testInfo.outputPath("phase-picker-desktop.png") });
  await page.getByTestId("duel-phase-battle").click();
  expect((await packets(page)).at(-1)!.slice(2)).toEqual([1, 6, 0, 0, 0]);
  await page.screenshot({ path: testInfo.outputPath("field-controls.png") });
});

test("position choices show the actual card or its back with counterclockwise defense and send the selected position", async ({
  page,
}, testInfo) => {
  await setup(page);
  await navigate(page, "/duel");
  await expect(page.getByTestId("duel-phase-select")).toBeVisible();
  // NeosModal's existing mount animation takes one second.
  await page.waitForTimeout(1100);
  await page.evaluate(async () => {
    const { default: selectPosition } = await import(
      "/src/service/duel/selectPosition.ts"
    );
    void selectPosition({
      code: 46986414,
      positions: [0, 1, 2, 3].map((position) => ({ position })),
    });
  });
  const choices = page.getByTestId("duel-position-option");
  await expect(choices).toHaveCount(4);
  await expect(choices.nth(0).locator("img")).toHaveAttribute(
    "src",
    /46986414/,
  );
  await expect(choices.nth(1).locator("img")).not.toHaveAttribute(
    "src",
    /46986414/,
  );
  await expect(choices.nth(2).locator("img")).toHaveCSS(
    "transform",
    "matrix(0, -1, 1, 0, 0, 0)",
  );
  await expect(choices.nth(3).locator("img")).toHaveCSS(
    "transform",
    "matrix(0, -1, 1, 0, 0, 0)",
  );
  await choices
    .locator("img")
    .evaluateAll((images) =>
      Promise.all(
        images.map((image) =>
          (image as HTMLImageElement).decode().catch(() => {}),
        ),
      ),
    );
  await page.screenshot({ path: testInfo.outputPath("position-choices.png") });
  await choices.nth(3).click();
  expect((await packets(page)).at(-1)!.slice(2)).toEqual([1, 8, 0, 0, 0]);
  await expect(page.getByTestId("duel-position-modal")).not.toBeVisible();
});

test("card-effect rock-paper-scissors uses the same protocol mapping", async ({
  page,
}) => {
  await setup(page);
  await navigate(page, "/duel");
  await expect(page.getByTestId("duel-phase-select")).toBeVisible();
  await page.waitForTimeout(1100);
  await page.evaluate(async () => {
    const { default: select } = await import(
      "/src/service/duel/rockPaperScissors.ts"
    );
    void select({ player: 0 });
  });
  await page
    .getByTestId("duel-option-item")
    .filter({ hasText: "石头" })
    .dblclick();
  expect((await packets(page)).at(-1)!.slice(2)).toEqual([1, 2, 0, 0, 0]);
  await page.evaluate(async () => {
    const { default: decode } = await import(
      "/src/api/ocgcore/ocgAdapter/stoc/stocGameMsg/handResult.ts"
    );
    const { default: handle } = await import("/src/service/duel/handResult.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    handle(getUIContainer(), decode(new Uint8Array([2 | (1 << 2)])));
  });
  await expect(page.getByText(/我方出示拳头，对方出示剪刀/)).toBeVisible();
});


test("MDPRO3 phase picker respects server flags and sends each phase response only once", async ({page}, info) => {
  await setup(page);
  await navigate(page, "/duel");
  const button = page.getByTestId("duel-phase-select");
  const picker = page.getByTestId("duel-phase-picker");
  await expect(button).toBeDisabled();
  await page.evaluate(() => window.__phaseMessage([11,0,0,0,0,0,0,0,0,1,0]));
  await expect(button).toHaveAttribute("data-available-phases", "end");
  await expect(page.getByTestId("duel-phase-turn")).toHaveText("TURN 3");
  await expect(button).toHaveAttribute("data-hint", "true");
  await button.click();
  await expect(picker.locator("button[data-phase]")).toHaveCount(6);
  await expect(page.getByTestId("duel-phase-main1")).toHaveAttribute("aria-current", "step");
  for (const phase of ["draw", "standby", "battle", "main2"]) await expect(page.getByTestId(`duel-phase-${phase}`)).toBeDisabled();
  await page.getByTestId("duel-phase-main1").click();
  await expect(picker).not.toBeVisible();
  expect(await packets(page)).toEqual([]);
  const agentActions = await collectPrivateActions(page, await observeDuel(page));
  expect(agentActions.filter(action => action.kind === "phase").map(action => action.phase)).toEqual(["end"]);
  await button.click();
  await expect(picker).toBeVisible();
  await expect(page.getByRole("dialog", {name: "选择阶段"})).toHaveCSS("transform", "none");
  await page.keyboard.press("Escape");
  await expect(picker).not.toBeVisible();
  await button.click();
  await page.getByRole("button", {name: /^取\s*消$/}).click();
  expect(await packets(page)).toEqual([]);
  await page.setViewportSize({width: 390, height: 844});
  await button.click();
  for (const phase of ["draw", "standby", "main1", "battle", "main2", "end"]) {
    const box = (await page.getByTestId(`duel-phase-${phase}`).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }
  await expect(page.getByRole("dialog", {name: "选择阶段"})).toHaveCSS("transform", "none");
  await page.getByTestId("duel-phase-end").hover();
  await page.screenshot({path: info.outputPath("phase-picker-mobile.png"), animations: "disabled"});
  await page.getByTestId("duel-phase-end").click();
  expect((await packets(page)).at(-1)!.slice(2)).toEqual([1,7,0,0,0]);
  await expect(button).toBeDisabled();
  await expect(picker).not.toBeVisible();
  await button.evaluate(element => { element.click(); element.click(); });
  expect((await packets(page)).length).toBe(1);
  await page.setViewportSize({width: 1280, height: 720});
  for (const [target, response] of [["main2",2],["end",3]] as const) {
    await page.evaluate(async () => {
      const {matStore} = await import("/src/stores/index.ts");
      const {ygopro} = await import("/src/api/index.ts");
      matStore.phase.currentPhase = ygopro.StocGameMessage.MsgNewPhase.PhaseType.BATTLE_START;
      await window.__phaseMessage([10,0,0,0,1,1]);
    });
    await button.click();
    await expect(page.getByTestId("duel-phase-battle")).toHaveAttribute("aria-current", "step");
    await expect(page.getByTestId("duel-phase-main1")).toBeDisabled();
    await page.getByTestId(`duel-phase-${target}`).click();
    expect((await packets(page)).at(-1)!.slice(2)).toEqual([1,response,0,0,0]);
    await expect(button).toBeDisabled();
  }
});

test("phase commands expire on other choices, card responses, turn changes and disconnect", async ({page}) => {
  await setup(page);
  await navigate(page,"/duel");
  const button = page.getByTestId("duel-phase-select");
  await page.evaluate(() => window.__phaseMessage([11,0,0,0,0,0,0,0,1,1,0]));
  await button.click();
  // A new card-selection prompt must close and invalidate the phase picker.
  await page.evaluate(async () => {
    const { default: gameMsg } = await import("/src/service/duel/gameMsg.ts");
    const { getUIContainer } = await import("/src/container/compat.ts");
    const { ygopro } = await import("/src/api/index.ts");
    void gameMsg(getUIContainer(), new ygopro.YgoStocMsg({stoc_game_msg: new ygopro.StocGameMessage({select_yes_no: new ygopro.StocGameMessage.MsgSelectYesNo({player: 0, effect_description: 0})})}));
  });
  await expect(button).toBeDisabled();
  await expect(page.getByTestId("duel-phase-picker")).not.toBeVisible();
  await page.evaluate(async () => {
    const {resetDuelDialogs} = await import("/src/stores/duelDialogs.ts");
    resetDuelDialogs();
    await window.__phaseMessage([11,0,0,0,0,0,0,0,1,1,0]);
    const {sendSelectIdleCmdResponse} = await import("/src/api/index.ts");
    const {getUIContainer} = await import("/src/container/compat.ts");
    sendSelectIdleCmdResponse(getUIContainer().conn, 5);
  });
  await expect(button).toBeDisabled();
  await page.evaluate(() => window.__phaseMessage([11,0,0,0,0,0,0,0,1,1,0]));
  await button.click();
  await page.evaluate(() => window.__phaseMessage([40,1]));
  await expect(button).toBeDisabled();
  await expect(button.locator("..")).toHaveAttribute("data-owner", "opponent");
  await expect(page.getByTestId("duel-phase-turn")).toHaveText("TURN 4");
  await expect(page.getByTestId("duel-phase-picker")).not.toBeVisible();
  await page.evaluate(async () => {
    const {matStore} = await import("/src/stores/index.ts");
    matStore.currentPlayer = 0;
    await window.__phaseMessage([11,0,0,0,0,0,0,0,1,1,0]);
  });
  await button.click();
  await page.evaluate(async () => {
    const {resetDuelDialogs} = await import("/src/stores/duelDialogs.ts");
    resetDuelDialogs(true);
  });
  await expect(button).toBeDisabled();
  await expect(page.getByTestId("duel-phase-picker")).not.toBeVisible();
  expect((await packets(page)).length).toBe(1);
});

test("phase status remains visible for spectators and replays and shows battle substeps", async ({page}) => {
  await setup(page);
  await navigate(page,"/duel");
  const button = page.getByTestId("duel-phase-select");
  for (const [phase, step] of [[16,"01"],[32,"02"],[64,"03"]] as const) {
    await page.evaluate(phase => window.__phaseMessage([41,phase,0]), phase);
    await expect(button).toContainText("Battle");
    await expect(page.getByTestId("duel-phase-step")).toHaveText(step);
  }
  await page.evaluate(async () => {
    const {matStore} = await import("/src/stores/index.ts");
    matStore.selfType = 3;
    await window.__phaseMessage([10,0,0,0,1,1]);
  });
  await expect(button).toBeVisible();
  await expect(button).toBeDisabled();
  await page.evaluate(async () => {
    const {matStore, replayStore} = await import("/src/stores/index.ts");
    matStore.selfType = 1;
    replayStore.isReplay = true;
  });
  await expect(button).toBeDisabled();
  await page.evaluate(async () => {
    const {matStore, replayStore} = await import("/src/stores/index.ts");
    replayStore.isReplay = false;
    matStore.selfType = 2;
    matStore.currentPlayer = 1;
    await window.__phaseMessage([10,1,0,0,0,1]);
  });
  await expect(button).toBeEnabled();
  await expect(button).toHaveAttribute("data-available-phases", "end");
  await expect(button.locator("..")).toHaveAttribute("data-owner", "self");
});
