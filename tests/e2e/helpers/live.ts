import { readFile } from "node:fs/promises";

import { expect, type Locator, type Page, type Route } from "@playwright/test";

export const LIVE_E2E_ENABLED = process.env.PLAYWRIGHT_LIVE === "1";

export interface LiveRoomOptions {
  botName?: string;
  chainSetting?: LiveChainSetting;
  mora?: "rock" | "paper" | "scissors";
  playerName?: string;
  roomPassword?: string;
  roomCodes?: string;
  roomPrefix?: string;
  tp?: "first" | "second";
}

export interface LiveDeck {
  deckName: string;
  main: number[];
  extra: number[];
  side: number[];
}

export type LiveChainSetting = "all" | "ignore" | "smart";

export const DEFAULT_AI_BOT_NAME = "蓝子";
export const DEFAULT_AI_ROOM_CODES = "AI,SS,NS,NC";
export const DEFAULT_AI_ROOM_PASSWORD = "AI,SS,NS,NC#有栖川蓝子";

export function uniqueLiveRoom(options: LiveRoomOptions = {}) {
  const roomSuffix = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const playerSuffix = `${Date.now().toString(36).slice(-4)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  const roomCodes = options.roomCodes ?? "NS,NC,TIME0";
  const roomPrefix = options.roomPrefix ?? "neos-e2e";
  const playerName = options.playerName ?? `e2e-${playerSuffix}`;

  return {
    botName: options.botName ?? DEFAULT_AI_BOT_NAME,
    playerName,
    password:
      options.roomPassword ?? `${roomCodes}#${roomPrefix}-${roomSuffix}`,
  };
}

export async function createCustomRoom(page: Page, options: LiveRoomOptions) {
  let room: ReturnType<typeof uniqueLiveRoom> | undefined;

  for (const attempt of [1, 2]) {
    room = uniqueLiveRoom(options);
    await page.goto("/match");
    await expect(page.getByTestId("match-mode-custom-room")).toBeVisible({
      timeout: 120000,
    });
    await expectSelectedDeck(page.getByTestId("match-deck-select"));

    await page.getByTestId("match-mode-custom-room").click();
    await page.getByTestId("match-modal-player").fill(room.playerName);
    await page.getByTestId("match-modal-password").fill(room.password);
    await page.getByTestId("match-modal-join").click();

    try {
      await expect(page).toHaveURL(/\/waitroom/, { timeout: 60000 });
      break;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }

  if (!room) throw new Error("Expected live room to be generated.");
  await expect(page.getByTestId("waitroom-player-me")).toHaveAttribute(
    "data-player-name",
    room.playerName,
    { timeout: 60000 },
  );
  await expectSelectedDeck(page.getByTestId("waitroom-deck-select"));

  return room;
}

export async function startAiDuel(page: Page, options: LiveRoomOptions = {}) {
  const room = await createCustomRoom(page, {
    botName: process.env.LIVE_E2E_BOT_NAME,
    playerName: process.env.LIVE_E2E_PLAYER_NAME,
    roomPassword:
      process.env.LIVE_E2E_ROOM_PASSWORD ?? DEFAULT_AI_ROOM_PASSWORD,
    roomCodes: process.env.LIVE_E2E_ROOM_CODES,
    roomPrefix: process.env.LIVE_E2E_ROOM_PREFIX,
    ...options,
  });

  await waitForAutoBot(page, room.botName);
  await completeDuelStartSelections(page, {
    mora: options.mora ?? "paper",
    tp: options.tp ?? "first",
  });
  await expectDuelStarted(page);
  await setChainSetting(page, options.chainSetting ?? "ignore");

  return room;
}

export async function readYdkDeck(
  deckPath: string,
  deckName: string,
): Promise<LiveDeck> {
  const text = await readFile(deckPath, "utf-8");
  const deck: LiveDeck = {
    deckName,
    main: [],
    extra: [],
    side: [],
  };
  let section: keyof Pick<LiveDeck, "main" | "extra" | "side"> | undefined;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#created")) continue;
    if (line === "#main") {
      section = "main";
      continue;
    }
    if (line === "#extra") {
      section = "extra";
      continue;
    }
    if (line === "!side") {
      section = "side";
      continue;
    }
    if (!section) continue;

    const code = Number(line);
    if (Number.isInteger(code)) deck[section].push(code);
  }

  return deck;
}

export async function installOnlyLiveDeck(page: Page, deck: LiveDeck) {
  const seedPath = "/__neos_e2e_deck_seed__";
  const seedHandler = async (route: Route) => {
    await route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><html><body></body></html>",
    });
  };

  await page.route(`**${seedPath}`, seedHandler);
  await page.goto(seedPath, { waitUntil: "domcontentloaded" });
  await page.evaluate(async (deckToInstall) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("decks");

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("decks")) {
          db.createObjectStore("decks");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("decks", "readwrite");
      const store = transaction.objectStore("decks");

      store.clear();
      store.put(deckToInstall, deckToInstall.deckName);

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  }, deck);
  await page.unroute(`**${seedPath}`, seedHandler);
}

export async function summonBot(page: Page, botName: string) {
  await page.getByTestId("waitroom-chat-input").fill(`/ai ${botName}`);
  await page.getByTestId("waitroom-chat-send").click();

  await expect(page.getByTestId("waitroom-player-op")).toContainText(botName, {
    timeout: 60000,
  });
}

export async function waitForAutoBot(page: Page, botName: string) {
  await expect(page.getByTestId("waitroom-player-op")).toContainText(botName, {
    timeout: 60000,
  });
}

export async function readyAndStartDuel(page: Page) {
  await page.getByTestId("waitroom-ready-toggle").click();
  await expect(page.getByTestId("waitroom-player-me")).toHaveAttribute(
    "data-player-ready",
    "true",
    { timeout: 30000 },
  );
  await expect(page.getByTestId("waitroom-player-op")).toHaveAttribute(
    "data-player-ready",
    "true",
    { timeout: 60000 },
  );
  await expect(page.getByTestId("waitroom-start")).toHaveAttribute(
    "aria-disabled",
    "false",
    { timeout: 30000 },
  );

  await page.getByTestId("waitroom-start").click();
}

export async function chooseRockPaperScissors(
  page: Page,
  mora: "rock" | "paper" | "scissors",
) {
  await page.getByTestId(`waitroom-mora-${mora}`).click({ timeout: 60000 });
}

export async function chooseTurnPlayer(page: Page, tp: "first" | "second") {
  await page.getByTestId(`waitroom-tp-${tp}`).click({ timeout: 60000 });
}

export async function completeDuelStartSelections(
  page: Page,
  options: {
    mora: "rock" | "paper" | "scissors";
    tp: "first" | "second";
  },
) {
  const deadline = Date.now() + 60000;

  while (Date.now() < deadline) {
    if (page.url().includes("/duel")) return;

    const tp = page.getByTestId(`waitroom-tp-${options.tp}`);
    if (await tp.isVisible()) {
      await tp.click();
      return;
    }

    const mora = page.getByTestId(`waitroom-mora-${options.mora}`);
    if (await mora.isVisible()) {
      await mora.click();
    }

    await page.waitForTimeout(250);
  }

  throw new Error("Timed out while completing live duel start selections.");
}

export async function expectDuelStarted(page: Page) {
  await expect(page).toHaveURL(/\/duel/, { timeout: 60000 });
  await expect(
    page
      .locator('[data-testid="duel-card"][data-card-details-visible="true"]')
      .first(),
  ).toBeVisible({
    timeout: 60000,
  });
}

export async function expectMyTurn(page: Page, timeout = 5000) {
  await expect(
    page.getByTestId("duel-phase-select"),
    "Expected to start as the turn player.",
  ).toBeEnabled({ timeout });
}

export async function setChainSetting(page: Page, setting: LiveChainSetting) {
  const toggle = page.getByTestId("duel-chain-setting");

  if ((await toggle.getAttribute("data-chain-setting")) === setting) return;

  await toggle.click();
  await page.getByTestId(`duel-chain-setting-${setting}`).click({
    timeout: 30000,
  });
  await expect(toggle).toHaveAttribute("data-chain-setting", setting);
}

export function duelCard(
  page: Page,
  filters: {
    code?: number;
    controller?: string | number;
    zone?: string;
    sequence?: number;
    idleAction?: string;
  },
) {
  const selector = [
    '[data-testid="duel-card"]',
    filters.zone ? `[data-card-zone="${filters.zone}"]` : "",
    filters.code !== undefined ? `[data-card-code="${filters.code}"]` : "",
    filters.controller !== undefined
      ? `[data-card-controller="${filters.controller}"]`
      : "",
    filters.sequence !== undefined
      ? `[data-card-sequence="${filters.sequence}"]`
      : "",
    filters.idleAction
      ? `[data-card-idle-actions~="${filters.idleAction}"]`
      : "",
  ].join("");

  return page.locator(selector);
}

export async function expectCardIdleAction(
  card: Locator,
  action: string,
  options?: {
    source?: "idle" | "battle";
    directAttackable?: boolean;
  },
) {
  await expect(card).toHaveAttribute(
    "data-card-idle-actions",
    new RegExp(`(^| )${action}( |$)`),
    { timeout: 60000 },
  );

  if (options?.source) {
    await expect(card).toHaveAttribute(
      "data-card-idle-response-sources",
      new RegExp(`(^| )${action}:${options.source}( |$)`),
    );
  }

  if (options?.directAttackable !== undefined) {
    await expect(card).toHaveAttribute(
      "data-card-attack-directable",
      String(options.directAttackable),
    );
  }
}

export async function expectNoIdleAction(page: Page, action: string) {
  await expect(
    page.locator(
      `[data-testid="duel-card"][data-card-idle-actions~="${action}"]`,
    ),
  ).toHaveCount(0, { timeout: 60000 });
}

export async function getPlayerLife(page: Page, player: "me" | "op") {
  const value = await page
    .locator(`[data-testid="duel-player-life"][data-player="${player}"]`)
    .getAttribute("data-life");

  expect(value, `Expected ${player} life points to be present.`).not.toBeNull();

  return Number(value);
}

export async function expectPlayerLifeBelow(
  page: Page,
  player: "me" | "op",
  life: number,
  timeout = 120000,
) {
  await expect
    .poll(async () => getPlayerLife(page, player), {
      message: `Expected ${player} life points to drop below ${life}.`,
      timeout,
    })
    .toBeLessThan(life);
}

export async function activateHandCard(page: Page, cardCode: number) {
  const handCard = duelCard(page, {
    code: cardCode,
    zone: "HAND",
    idleAction: "ACTIVATE",
  }).first();

  await expect(handCard).toBeVisible({ timeout: 60000 });
  const controller = await handCard.getAttribute("data-card-controller");
  expect(
    controller,
    "Expected activatable hand card to have a controller.",
  ).not.toBeNull();

  await clickCardAction(page, handCard, "activate");
  await chooseSelectableZoneIfAvailable(page, {
    zone: "SZONE",
    controller: controller!,
    sequence: 2,
    timeout: 5000,
  });
}

export async function getControllerOfHandCard(page: Page, cardCode: number) {
  const handCard = duelCard(page, {
    code: cardCode,
    zone: "HAND",
  }).first();

  await expect(handCard).toBeVisible({ timeout: 60000 });
  const controller = await handCard.getAttribute("data-card-controller");
  expect(controller, "Expected hand card to have a controller.").not.toBeNull();

  return controller!;
}

export async function setHandCard(page: Page, cardCode: number) {
  return setHandCardToSpellTrapZone(page, cardCode, { sequence: 2 });
}

export async function setHandCardToSpellTrapZone(
  page: Page,
  cardCode: number,
  options: {
    sequence: number;
  },
) {
  const handCard = duelCard(page, {
    code: cardCode,
    zone: "HAND",
    idleAction: "SSET",
  }).first();

  await expect(handCard).toBeVisible({ timeout: 60000 });
  const controller = await handCard.getAttribute("data-card-controller");
  expect(
    controller,
    "Expected settable hand card to have a controller.",
  ).not.toBeNull();

  await clickCardAction(page, handCard, "sset");

  await chooseSelectableZoneIfAvailable(page, {
    zone: "SZONE",
    controller: controller!,
    sequence: options.sequence,
    timeout: 5000,
  });
  await expect(
    duelCard(page, {
      controller,
      zone: "SZONE",
      sequence: options.sequence,
    }).first(),
  ).toBeVisible({ timeout: 60000 });

  return controller!;
}

export async function expectControllerHandCount(
  page: Page,
  controller: string | number,
  count: number,
  options: {
    timeout?: number;
  } = {},
) {
  await expect(
    duelCard(page, {
      controller,
      zone: "HAND",
    }),
    `Expected controller ${controller} to have ${count} hand cards.`,
  ).toHaveCount(count, { timeout: options.timeout ?? 60000 });
}

export async function selectCardsFromModal(page: Page, cardCodes: number[]) {
  const modal = activeSelectCardsModal(page);

  try {
    await expect(modal).toBeVisible({
      timeout: 5000,
    });
  } catch {
    await selectSelectableCards(page, cardCodes);

    return;
  }

  if (cardCodes.length === 1) {
    const option = modal
      .locator(
        `[data-testid="duel-select-card-option"][data-card-code="${cardCodes[0]}"]`,
      )
      .first();

    if (await quickSelectSingleCardOptionIfAvailable(modal, option)) return;
  }

  for (const cardCode of cardCodes) {
    const option = modal
      .locator(
        `[data-testid="duel-select-card-option"][data-card-code="${cardCode}"]`,
      )
      .first();
    await chooseSelectCardOption(option);
  }

  const submit = page
    .locator('[data-testid="duel-select-card-submit"]:visible:enabled')
    .last();
  await expect(submit).toBeEnabled({ timeout: 30000 });
  await submit.click();
}

export async function selectVisibleCardsFromModal(
  page: Page,
  cardCodes: number[],
) {
  const modal = activeSelectCardsModal(page);

  await expect(modal).toBeVisible({
    timeout: 60000,
  });

  let selectedCount = 0;
  for (const cardCode of cardCodes) {
    const option = modal
      .locator(
        `[data-testid="duel-select-card-option"][data-card-code="${cardCode}"]`,
      )
      .first();

    if (await option.isVisible()) {
      await chooseSelectCardOption(option);
      selectedCount += 1;
    }
  }

  expect(
    selectedCount,
    "Expected at least one requested card to be selectable in the modal.",
  ).toBeGreaterThan(0);

  const submit = page
    .locator('[data-testid="duel-select-card-submit"]:visible:enabled')
    .last();
  await expect(submit).toBeEnabled({ timeout: 30000 });
  await submit.click();
}

export async function selectVisibleCardsFromModalIfAvailable(
  page: Page,
  cardCodes: number[],
  timeout = 5000,
) {
  const modal = activeSelectCardsModal(page);

  try {
    await expect(modal).toBeVisible({
      timeout,
    });
  } catch {
    return false;
  }

  let selectedCount = 0;
  for (const cardCode of cardCodes) {
    const option = modal
      .locator(
        `[data-testid="duel-select-card-option"][data-card-code="${cardCode}"]`,
      )
      .first();

    if (await option.isVisible()) {
      await chooseSelectCardOption(option);
      selectedCount += 1;
    }
  }

  if (selectedCount === 0) return false;

  const submit = page
    .locator('[data-testid="duel-select-card-submit"]:visible:enabled')
    .last();
  await expect(submit).toBeEnabled({ timeout: 30000 });
  await submit.dispatchEvent("click");

  return true;
}

export async function selectFirstCardFromModalIfAvailable(
  page: Page,
  timeout = 5000,
) {
  const modal = activeSelectCardsModal(page);

  try {
    await expect(modal).toBeVisible({
      timeout,
    });
  } catch {
    return false;
  }

  const option = modal
    .locator('[data-testid="duel-select-card-option"]')
    .first();
  await expect(option).toBeVisible({ timeout: 30000 });
  await option.dispatchEvent("dblclick");

  return true;
}

export async function selectCardsIfRequested(
  page: Page,
  cardCodes: number[],
  timeout = 5000,
) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const modal = activeSelectCardsModal(page);
    if (await modal.isVisible()) {
      const requestedOption = modal
        .locator(
          `[data-testid="duel-select-card-option"][data-card-code="${cardCodes[0]}"]`,
        )
        .first();
      if (!(await requestedOption.isVisible())) return false;

      await selectCardsFromModal(page, cardCodes);

      return true;
    }

    const selectable = page
      .locator(
        `[data-testid="duel-card"][data-card-code="${cardCodes[0]}"][data-card-selectable="true"]`,
      )
      .first();
    if (await selectable.isVisible()) {
      await selectSelectableCards(page, cardCodes);

      return true;
    }

    await page.waitForTimeout(100);
  }

  return false;
}

export async function cancelSelectCardsModalIfVisible(page: Page) {
  const cancel = page
    .locator('[data-testid="duel-select-card-cancel"]:visible')
    .last();

  if (await cancel.isVisible()) {
    await cancel.click();
    return true;
  }

  return false;
}

export async function expectSelectCardsModal(
  page: Page,
  options: {
    cardCodes?: number[];
    min?: number;
    max?: number;
    cancelable?: boolean;
  } = {},
) {
  const modal = activeSelectCardsModal(page);

  await expect(modal).toBeVisible({
    timeout: 60000,
  });

  for (const cardCode of options.cardCodes ?? []) {
    await expect(
      modal
        .locator(
          `[data-testid="duel-select-card-option"][data-card-code="${cardCode}"]`,
        )
        .first(),
    ).toBeVisible({ timeout: 60000 });
  }

  if (options.min !== undefined) {
    await expect(modal).toHaveAttribute("data-select-min", String(options.min));
  }
  if (options.max !== undefined) {
    await expect(modal).toHaveAttribute("data-select-max", String(options.max));
  }
  if (options.cancelable !== undefined) {
    await expect(modal).toHaveAttribute(
      "data-select-cancelable",
      String(options.cancelable),
    );
  }
}

export async function expectSelectChainModal(
  page: Page,
  options: {
    cardCodes: number[];
    controller?: string | number;
    zone?: string;
    min?: number;
    max?: number;
    cancelable?: boolean;
  },
) {
  const modal = activeSelectChainModal(page);

  await expect(modal).toBeVisible({ timeout: 120000 });
  await expect(modal).toHaveAttribute(
    "data-select-min",
    String(options.min ?? 1),
  );
  await expect(modal).toHaveAttribute(
    "data-select-max",
    String(options.max ?? 1),
  );
  await expect(modal).toHaveAttribute("data-select-single", "false");
  await expect(modal).toHaveAttribute("data-select-is-chain", "true");
  await expect(modal).toHaveAttribute(
    "data-select-cancelable",
    String(options.cancelable ?? true),
  );
  await expect(
    modal.locator('[data-testid="duel-select-card-option"]'),
  ).toHaveCount(options.cardCodes.length);

  for (const cardCode of options.cardCodes) {
    const selector = [
      '[data-testid="duel-select-card-option"]',
      `[data-card-code="${cardCode}"]`,
      options.controller !== undefined
        ? `[data-card-controller="${options.controller}"]`
        : "",
      options.zone ? `[data-card-zone="${options.zone}"]` : "",
    ].join("");

    await expect(modal.locator(selector)).toHaveCount(1);
  }

  await expect(
    page.locator('[data-testid="duel-select-card-cancel"]:visible').last(),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="duel-select-card-submit"]:visible').last(),
  ).toBeDisabled();
}

export async function selectChainCardFromModal(page: Page, cardCode: number) {
  const modal = activeSelectChainModal(page);

  await expect(modal).toBeVisible({
    timeout: 120000,
  });

  await modal
    .locator(
      `[data-testid="duel-select-card-option"][data-card-code="${cardCode}"]`,
    )
    .first()
    .click();

  const submit = page
    .locator('[data-testid="duel-select-card-submit"]:visible:enabled')
    .last();
  await expect(submit).toBeEnabled({ timeout: 30000 });
  await submit.click();
}

export async function expectChainMarker(
  page: Page,
  options: {
    index: number;
    controller: string | number;
    zone: string;
    sequence: number;
  },
) {
  const marker = page.locator(
    [
      '[data-testid="duel-chain-marker"]',
      `[data-chain-index="${options.index}"]`,
      `[data-chain-controller="${options.controller}"]`,
      `[data-chain-zone="${options.zone}"]`,
      `[data-chain-sequence="${options.sequence}"]`,
    ].join(""),
  );

  await expect(marker).toBeVisible({ timeout: 60000 });
}

export async function selectCardFromModalIfVisible(
  page: Page,
  cardCode: number,
) {
  if (await activeSelectCardsModal(page).isVisible()) {
    await selectCardsFromModal(page, [cardCode]);
  }
}

export async function selectSelectableCards(page: Page, cardCodes: number[]) {
  for (const cardCode of cardCodes) {
    const card = page
      .locator(
        `[data-testid="duel-card"][data-card-code="${cardCode}"][data-card-selectable="true"]`,
      )
      .first();

    await expect(card).toBeVisible({ timeout: 60000 });
    await card.click();
    await page.waitForTimeout(250);
  }
}

export async function expectSelectableCards(page: Page, cardCodes: number[]) {
  for (const cardCode of cardCodes) {
    await expect(
      page
        .locator(
          `[data-testid="duel-card"][data-card-code="${cardCode}"][data-card-selectable="true"]`,
        )
        .first(),
    ).toBeVisible({ timeout: 60000 });
  }
}

export async function selectFirstSelectableCard(page: Page) {
  const card = page
    .locator('[data-testid="duel-card"][data-card-selectable="true"]')
    .first();

  await expect(card).toBeVisible({ timeout: 60000 });
  await card.click();
}

export async function chooseFirstOption(page: Page) {
  const modal = page.locator('[data-testid="duel-option-modal"]:visible');
  await expect(modal).toBeVisible({ timeout: 60000 });
  await page
    .locator('[data-testid="duel-option-item"]:visible')
    .first()
    .click();
  await page.locator('[data-testid="duel-option-submit"]:visible').click();
}

export async function announceNumbers(page: Page, numbers: number[]) {
  for (const [index, number] of numbers.entries()) {
    const modal = page.locator('[data-testid="duel-option-modal"]:visible');
    await expect(modal).toBeVisible({ timeout: 60000 });
    await expect(modal).toHaveAttribute("data-option-min", "1");

    const option = page
      .locator(
        `[data-testid="duel-option-item"][data-option-text="${number}"]:visible`,
      )
      .first();

    await expect(option).toBeVisible({ timeout: 30000 });
    await option.click();

    const submit = page.locator('[data-testid="duel-option-submit"]:visible');
    await expect(submit).toBeEnabled({ timeout: 30000 });
    await submit.click();

    if (index === numbers.length - 1) {
      await expect(modal).toBeHidden({ timeout: 60000 });
    } else {
      await expect(
        page.locator(
          `[data-testid="duel-option-item"][data-option-text="${number}"]:visible`,
        ),
      ).toHaveCount(0, { timeout: 60000 });
    }
  }
}

export async function chooseDuelPhase(
  page: Page,
  phase: "battle" | "main2" | "end",
) {
  const phaseSelect = page.getByTestId("duel-phase-select");
  const previousPhase = await phaseSelect.getAttribute("data-current-phase");

  for (const _ of [0, 1, 2]) {
    await phaseSelect.click();

    const phaseItem = page
      .locator(`[data-testid="duel-phase-${phase}"]:visible`)
      .last();
    await expect(phaseItem).toBeVisible({ timeout: 30000 });
    await phaseItem.click();

    try {
      await expect
        .poll(async () => phaseSelect.getAttribute("data-current-phase"), {
          message: `Expected duel phase to leave ${previousPhase} after selecting ${phase}.`,
          timeout: 5000,
        })
        .not.toBe(previousPhase);
      return;
    } catch {
      await page.waitForTimeout(500);
    }
  }

  await expect
    .poll(async () => phaseSelect.getAttribute("data-current-phase"), {
      message: `Expected duel phase to leave ${previousPhase} after selecting ${phase}.`,
    })
    .not.toBe(previousPhase);
}

export async function endCurrentTurn(page: Page) {
  const phaseSelect = page.getByTestId("duel-phase-select");

  for (const _ of [0, 1, 2]) {
    if (await phaseSelect.isDisabled()) return;

    await chooseDuelPhase(page, "end");

    try {
      await expect(phaseSelect).toBeDisabled({ timeout: 10000 });
      return;
    } catch {
      // Selecting End Phase from Main Phase can move only into End Phase.
      // Click End again while still active to pass priority and finish turn.
    }
  }

  await expect(phaseSelect).toBeDisabled({ timeout: 30000 });
}

export async function chooseYesNo(page: Page, answer: "yes" | "no") {
  const button = page.locator(`[data-testid="duel-yesno-${answer}"]:visible`);
  await expect(button).toBeVisible({ timeout: 60000 });
  await button.click();
}

export async function choosePositionIfVisible(page: Page, position: string) {
  if (
    await page
      .locator('[data-testid="duel-position-modal"]:visible')
      .isVisible()
  ) {
    await page
      .locator(
        `[data-testid="duel-position-option"][data-position="${position}"]:visible`,
      )
      .last()
      .click();
  }
}

export async function chooseSelectableMainMonsterZone(
  page: Page,
  options: {
    controller: string | number;
    sequence: number;
  },
) {
  await chooseSelectableZone(page, {
    zone: "MZONE",
    controller: options.controller,
    sequence: options.sequence,
  });
}

export async function chooseSelectableZone(
  page: Page,
  options: {
    zone: string;
    controller: string | number;
    sequence: number;
  },
) {
  const targetZone = page.locator(
    [
      '[data-testid="duel-zone"]',
      `[data-zone="${options.zone}"]`,
      `[data-controller="${options.controller}"]`,
      `[data-sequence="${options.sequence}"]`,
    ].join(""),
  );

  await expect(targetZone).toHaveAttribute("data-place-selectable", "true", {
    timeout: 30000,
  });
  await targetZone.click();
}

export async function chooseSelectableZoneIfVisible(
  page: Page,
  options: {
    zone: string;
    controller: string | number;
    sequence: number;
  },
) {
  const targetZone = page.locator(
    [
      '[data-testid="duel-zone"]',
      `[data-zone="${options.zone}"]`,
      `[data-controller="${options.controller}"]`,
      `[data-sequence="${options.sequence}"]`,
      '[data-place-selectable="true"]',
    ].join(""),
  );

  if (await targetZone.isVisible()) {
    await targetZone.click();

    return true;
  }

  return false;
}

export async function chooseSelectableZoneIfAvailable(
  page: Page,
  options: {
    zone: string;
    controller: string | number;
    sequence: number;
    timeout?: number;
  },
) {
  const deadline = Date.now() + (options.timeout ?? 5000);

  while (Date.now() < deadline) {
    if (await chooseSelectableZoneIfVisible(page, options)) return true;
    await page.waitForTimeout(100);
  }

  return false;
}

export async function specialSummonHandCardToMainMonsterZone(
  page: Page,
  options: {
    cardCode: number;
    sequence: number;
    position?: string;
  },
) {
  const handCard = duelCard(page, {
    code: options.cardCode,
    zone: "HAND",
    idleAction: "SP_SUMMON",
  }).first();

  await expect(handCard).toBeVisible({ timeout: 60000 });

  const controller = await handCard.getAttribute("data-card-controller");
  expect(
    controller,
    "Expected special summonable hand card to have a controller.",
  ).not.toBeNull();

  await clickCardAction(page, handCard, "sp_summon");
  await resolveSummonPlacement(page, {
    cardCode: options.cardCode,
    controller: controller!,
    sequence: options.sequence,
    position: options.position ?? "FACEUP_ATTACK",
  });

  return controller!;
}

export async function specialSummonExtraDeckCardToMainMonsterZone(
  page: Page,
  cardCode: number,
) {
  const extraCard = duelCard(page, {
    code: cardCode,
    zone: "EXTRA",
    idleAction: "SP_SUMMON",
  }).first();

  await expect(extraCard).toBeVisible({ timeout: 60000 });
  await expectCardIdleAction(extraCard, "SP_SUMMON", { source: "idle" });
  await clickCardAction(page, extraCard, "sp_summon");
  expect(
    await selectCardFromActiveModalIfVisible(page, cardCode, 60000),
    "Expected extra deck summon action to request the extra deck card.",
  ).toBe(true);
}

export async function resolveSummonPlacement(
  page: Page,
  options: {
    cardCode: number;
    controller: string | number;
    sequence: number;
    position?: string;
  },
) {
  const deadline = Date.now() + 60000;
  const expectedCard = duelCard(page, {
    code: options.cardCode,
    zone: "MZONE",
    controller: options.controller,
    sequence: options.sequence,
  });

  while (Date.now() < deadline) {
    if (await expectedCard.isVisible()) return;

    if (options.position) {
      await choosePositionIfVisible(page, options.position);
    }

    await chooseSelectableZoneIfVisible(page, {
      zone: "MZONE",
      controller: options.controller,
      sequence: options.sequence,
    });

    await page.waitForTimeout(250);
  }

  await expect(expectedCard).toBeVisible({ timeout: 1 });
}

export async function resolveSummonToAnyMainMonsterZone(
  page: Page,
  options: {
    cardCode: number;
    controller: string | number;
    position?: string;
  },
) {
  const deadline = Date.now() + 60000;
  const expectedCard = duelCard(page, {
    code: options.cardCode,
    zone: "MZONE",
    controller: options.controller,
  }).first();

  while (Date.now() < deadline) {
    if (await expectedCard.isVisible()) {
      const sequence = await expectedCard.getAttribute("data-card-sequence");
      expect(
        sequence,
        "Expected summoned card to have a sequence.",
      ).not.toBeNull();

      return Number(sequence);
    }

    if (options.position) {
      await choosePositionIfVisible(page, options.position);
    }

    const targetZone = page
      .locator(
        [
          '[data-testid="duel-zone"]',
          '[data-zone="MZONE"]',
          '[data-place-selectable="true"]',
        ].join(""),
      )
      .first();
    if (await targetZone.isVisible()) {
      await targetZone.click();
    }

    await page.waitForTimeout(250);
  }

  await expect(expectedCard).toBeVisible({ timeout: 1 });
  const sequence = await expectedCard.getAttribute("data-card-sequence");
  expect(sequence, "Expected summoned card to have a sequence.").not.toBeNull();

  return Number(sequence);
}

export async function expectOverlayMaterialCount(
  page: Page,
  options: {
    controller: string | number;
    sequence: number;
    count: number;
  },
) {
  await expect(
    page.locator(
      [
        '[data-testid="duel-card"]',
        '[data-card-zone="MZONE"]',
        `[data-card-controller="${options.controller}"]`,
        `[data-card-sequence="${options.sequence}"]`,
        '[data-card-is-overlay="true"]',
      ].join(""),
    ),
  ).toHaveCount(options.count, { timeout: 60000 });
}

export async function openCardDetail(
  page: Page,
  card: Locator,
  options: {
    timeout?: number;
  } = {},
) {
  await expect(card).toBeVisible({ timeout: 60000 });
  const cardCode = await card.getAttribute("data-card-code");
  const detail = page.getByTestId("duel-card-detail");
  const deadline = Date.now() + (options.timeout ?? 60000);

  while (Date.now() < deadline) {
    await closeVisibleDrawer(page);
    await card.scrollIntoViewIfNeeded();
    await card.click({ force: true, timeout: 3000 });

    try {
      await expect(detail).toBeVisible({ timeout: 3000 });
      if (cardCode) {
        await expect(detail).toHaveAttribute("data-card-code", cardCode, {
          timeout: 3000,
        });
      }

      return;
    } catch {
      await page.waitForTimeout(250);
    }
  }

  await expect(detail).toBeVisible({ timeout: 1 });
  if (cardCode) {
    await expect(detail).toHaveAttribute("data-card-code", cardCode, {
      timeout: 1,
    });
  }
}

export async function expectCardStats(
  page: Page,
  card: Locator,
  options: {
    attack?: number;
    defense?: number;
  },
) {
  const deadline = Date.now() + 120000;

  while (Date.now() < deadline) {
    try {
      await openCardDetail(page, card, { timeout: 5000 });
    } catch {
      await closeVisibleDrawer(page);
      await page.waitForTimeout(500);
      continue;
    }

    if (await cardStatsMatch(page, options)) return;

    await closeVisibleDrawer(page);
    await page.waitForTimeout(500);
  }

  await openCardDetail(page, card, { timeout: 5000 });
  await expectCardStatValues(page, options);
}

export async function expectCardCounter(
  page: Page,
  card: Locator,
  options: {
    counterType: number;
    count: number;
  },
) {
  await openCardDetail(page, card);
  await expect(
    page.locator(
      [
        '[data-testid="duel-card-counter"]',
        `[data-counter-type="${options.counterType}"]`,
      ].join(""),
    ),
  ).toHaveAttribute("data-counter-count", String(options.count), {
    timeout: 60000,
  });
}

async function cardStatsMatch(
  page: Page,
  options: {
    attack?: number;
    defense?: number;
  },
) {
  const [attack, defense] = await Promise.all([
    readCardStatValue(page, "ATK"),
    readCardStatValue(page, "DEF"),
  ]);

  return (
    (options.attack === undefined || attack === String(options.attack)) &&
    (options.defense === undefined || defense === String(options.defense))
  );
}

async function expectCardStatValues(
  page: Page,
  options: {
    attack?: number;
    defense?: number;
  },
) {
  if (options.attack !== undefined) {
    await expect(
      page.locator('[data-testid="duel-card-stat"][data-stat="ATK"]'),
    ).toHaveAttribute("data-stat-value", String(options.attack), {
      timeout: 1000,
    });
  }

  if (options.defense !== undefined) {
    await expect(
      page.locator('[data-testid="duel-card-stat"][data-stat="DEF"]'),
    ).toHaveAttribute("data-stat-value", String(options.defense), {
      timeout: 1000,
    });
  }
}

async function readCardStatValue(page: Page, stat: "ATK" | "DEF") {
  const locator = page.locator(
    `[data-testid="duel-card-stat"][data-stat="${stat}"]`,
  );

  if (!(await locator.isVisible())) return undefined;

  return locator.getAttribute("data-stat-value");
}

export async function waitForAnnounceCardModal(
  page: Page,
  options?: {
    controller?: string | number;
    spellTrapSequence?: number;
  },
) {
  const deadline = Date.now() + 60000;

  while (Date.now() < deadline) {
    if (
      await page
        .locator('[data-testid="duel-announce-modal"]:visible')
        .isVisible()
    ) {
      return;
    }

    if (
      options?.controller !== undefined &&
      options.spellTrapSequence !== undefined
    ) {
      await chooseSelectableZoneIfVisible(page, {
        zone: "SZONE",
        controller: options.controller,
        sequence: options.spellTrapSequence,
      });
    }

    await page.waitForTimeout(250);
  }

  await expect(
    page.locator('[data-testid="duel-announce-modal"]:visible'),
  ).toBeVisible({
    timeout: 1,
  });
}

export async function normalSummonToMainMonsterZone(
  page: Page,
  options: {
    cardCode: number;
    sequence: number;
  },
) {
  const handCard = duelCard(page, {
    code: options.cardCode,
    zone: "HAND",
    idleAction: "SUMMON",
  }).first();

  await expect(handCard).toBeVisible({ timeout: 60000 });

  const controller = await handCard.getAttribute("data-card-controller");
  expect(
    controller,
    "Expected summonable hand card to have a controller.",
  ).not.toBeNull();

  await clickCardAction(page, handCard, "summon");

  await chooseSelectableMainMonsterZone(page, {
    controller,
    sequence: options.sequence,
  });

  await expect(
    duelCard(page, {
      code: options.cardCode,
      zone: "MZONE",
      controller,
      sequence: options.sequence,
    }),
  ).toBeVisible({ timeout: 60000 });
}

export async function announceCardBySearch(
  page: Page,
  options: {
    search: string;
    cardCode?: number;
  },
) {
  await expect(
    page.locator('[data-testid="duel-announce-modal"]:visible'),
  ).toBeVisible({
    timeout: 60000,
  });
  await page
    .locator('[data-testid="duel-announce-search"]:visible')
    .fill(options.search);
  await page
    .locator('[data-testid="duel-announce-search-submit"]:visible')
    .click();
  const cardOption =
    options.cardCode === undefined
      ? page
          .locator(
            '[data-testid="duel-announce-card-option"]:visible input[type="checkbox"]',
          )
          .first()
      : page.locator(
          `[data-testid="duel-announce-card-option"][data-card-code="${options.cardCode}"]:visible input[type="checkbox"]`,
        );
  await cardOption.click({ timeout: 30000 });
  await page.locator('[data-testid="duel-announce-submit"]:visible').click();
}

export async function surrenderAndClosePage(page: Page) {
  await page.keyboard.press("Escape");
  await closeVisibleDrawer(page, { required: false });

  const surrender = page.getByTestId("duel-surrender");
  const confirm = page.getByTestId("duel-surrender-confirm").last();

  for (const _ of [0, 1, 2]) {
    await surrender.click({ force: true });
    if (await confirm.isVisible()) break;

    await surrender.dispatchEvent("click");
    if (await confirm.isVisible()) break;

    await page.waitForTimeout(250);
  }

  await expect(confirm).toBeVisible({ timeout: 30000 });
  await confirm.dispatchEvent("click");

  await expect(page.getByTestId("duel-end-modal")).toBeVisible({
    timeout: 60000,
  });
  await expect(page.getByTestId("duel-end-result")).toHaveText(/Defeated|Win/);

  await page.close();
}

async function closeVisibleDrawer(
  page: Page,
  options: {
    required?: boolean;
  } = {},
) {
  const close = page.locator(".ant-drawer-close:visible").last();

  if (await close.isVisible()) {
    await close.dispatchEvent("click");
    try {
      await expect(page.getByTestId("duel-card-detail")).toBeHidden({
        timeout: 5000,
      });
    } catch (error) {
      if (options.required ?? true) throw error;
    }
  }
}

async function expectSelectedDeck(deckSelect: Locator) {
  await expect(
    deckSelect.locator(".ant-select-selection-item").first(),
    "Expected a deck to be selected before entering a live room.",
  ).not.toHaveText("", { timeout: 120000 });
}

export async function clickDuelAction(page: Page, action: string) {
  const item = visibleDuelAction(page, action);
  await expect(item).toBeVisible({ timeout: 30000 });
  await item.click();
}

export async function clickCardAction(
  page: Page,
  card: Locator,
  action: string,
) {
  const item = visibleDuelAction(page, action);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await card.click();
    try {
      await expect(item).toBeVisible({ timeout: 1000 });
      break;
    } catch {
      await page.waitForTimeout(100);
    }
  }

  await clickDuelAction(page, action);
}

function visibleDuelAction(page: Page, action: string) {
  return page.locator(`[data-testid="duel-action-${action}"]:visible`).last();
}

function activeSelectCardsModal(page: Page) {
  return page
    .locator(
      '[data-testid="duel-select-cards-modal"]:visible:not([data-select-max="0"])',
    )
    .last();
}

async function selectCardFromActiveModalIfVisible(
  page: Page,
  cardCode: number,
  timeout = 5000,
) {
  const modal = activeSelectCardsModal(page);

  try {
    await expect(modal).toBeVisible({ timeout });
  } catch {
    return false;
  }

  const option = modal
    .locator(
      `[data-testid="duel-select-card-option"][data-card-code="${cardCode}"]`,
    )
    .first();

  try {
    await expect(option).toBeVisible({ timeout });
  } catch {
    return false;
  }

  if (await quickSelectSingleCardOptionIfAvailable(modal, option)) {
    return true;
  }

  await chooseSelectCardOption(option);

  const submit = page
    .locator('[data-testid="duel-select-card-submit"]:visible:enabled')
    .last();
  await expect(submit).toBeEnabled({ timeout: 30000 });
  await submit.click();

  return true;
}

async function quickSelectSingleCardOptionIfAvailable(
  modal: Locator,
  option: Locator,
) {
  const [max, single] = await Promise.all([
    modal.getAttribute("data-select-max"),
    modal.getAttribute("data-select-single"),
  ]);

  if (max !== "1" && single !== "true") return false;

  await expect(option).toBeVisible({ timeout: 30000 });
  await option.dispatchEvent("dblclick");

  return true;
}

async function chooseSelectCardOption(option: Locator) {
  const input = option
    .locator('input[type="checkbox"], input[type="radio"]')
    .first();

  if ((await input.count()) > 0) {
    await input.check({ force: true });

    return;
  }

  await option.click({ force: true });
}

function activeSelectChainModal(page: Page) {
  return page
    .locator(
      '[data-testid="duel-select-cards-modal"][data-select-is-chain="true"]:visible:not([data-select-max="0"])',
    )
    .last();
}
