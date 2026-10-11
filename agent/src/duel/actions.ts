import type { Page } from "@playwright/test";

import type {
  AgentPrivateAction,
  DuelObservation,
  LlmVisibleAction,
  NewAgentPrivateAction,
  RawActionCard,
  RawActionSnapshot,
  RawActionZone,
  RawSelectCardOption,
} from "../types.ts";

const CARD_ACTION_DESCRIPTIONS: Record<string, string> = {
  SUMMON: "Normal Summon",
  SP_SUMMON: "Special Summon",
  POS_CHANGE: "Change the battle position of",
  MSET: "Set",
  SSET: "Set",
  ACTIVATE: "Activate",
  ATTACK: "Attack with",
};

const PHASE_DESCRIPTIONS: Record<
  NonNullable<AgentPrivateAction["phase"]>,
  string
> = {
  battle: "Enter the Battle Phase.",
  main2: "Enter Main Phase 2.",
  end: "End your turn.",
};

export async function collectPrivateActions(
  page: Page,
  observation: DuelObservation,
): Promise<AgentPrivateAction[]> {
  const raw = await page.evaluate<RawActionSnapshot>(() => {
    const visible = (element: Element) => {
      const html = element as HTMLElement;
      return Boolean(
        html.offsetWidth || html.offsetHeight || html.getClientRects().length,
      );
    };
    const attr = (element: Element, name: string) => element.getAttribute(name);

    const cards: RawActionCard[] = [
      ...document.querySelectorAll('[data-testid="duel-card"]'),
    ]
      .filter(visible)
      .map((element) => ({
        uuid: attr(element, "data-card-uuid"),
        code: attr(element, "data-card-code"),
        controller: attr(element, "data-card-controller"),
        zone: attr(element, "data-card-zone"),
        sequence: attr(element, "data-card-sequence"),
        position: attr(element, "data-card-position"),
        idleActions: (attr(element, "data-card-idle-actions") ?? "")
          .split(/\s+/)
          .filter(Boolean),
        selectable: attr(element, "data-card-selectable") === "true",
      }));

    const phaseSelect = document.querySelector(
      '[data-testid="duel-phase-select"]',
    );
    const phase = {
      visible: phaseSelect ? visible(phaseSelect) : false,
      enabled: phaseSelect ? !phaseSelect.hasAttribute("disabled") : false,
      available: (phaseSelect?.getAttribute("data-available-phases") ?? "")
        .split(/\s+/)
        .filter(Boolean),
    };

    const zones = [
      ...document.querySelectorAll(
        '[data-testid="duel-zone"][data-place-selectable="true"]',
      ),
    ]
      .filter(visible)
      .map((element) => ({
        zone: attr(element, "data-zone"),
        controller: attr(element, "data-controller"),
        sequence: attr(element, "data-sequence"),
      }));

    const options = [
      ...document.querySelectorAll('[data-testid="duel-option-item"]'),
    ]
      .filter(visible)
      .map((element) => ({
        text:
          attr(element, "data-option-text") ??
          element.textContent?.trim() ??
          "option",
        response: attr(element, "data-option-response"),
      }));

    const positions = [
      ...document.querySelectorAll('[data-testid="duel-position-option"]'),
    ]
      .filter(visible)
      .map((element) => ({
        position:
          attr(element, "data-position") ??
          element.textContent?.trim() ??
          "position",
      }));

    const selectCards = [
      ...document.querySelectorAll('[data-testid="duel-select-card-option"]'),
    ]
      .filter(visible)
      .map((element) => ({
        code: attr(element, "data-card-code"),
        controller: attr(element, "data-card-controller"),
        zone: attr(element, "data-card-zone"),
        sequence: attr(element, "data-card-sequence"),
      }));

    const yes = document.querySelector('[data-testid="duel-yesno-yes"]');
    const no = document.querySelector('[data-testid="duel-yesno-no"]');

    return {
      cards,
      phase,
      zones,
      options,
      positions,
      selectCards,
      yesVisible: yes ? visible(yes) : false,
      noVisible: no ? visible(no) : false,
    };
  });

  const builder = new ActionBuilder();

  for (const card of raw.cards) {
    for (const action of card.idleActions) {
      builder.add({
        kind: "card_action",
        llmDescription: describeCardAction(action, card),
        selector: cardSelector(card),
        action,
        debug: card,
      });
    }
  }

  if (raw.phase.visible && raw.phase.enabled) {
    for (const phase of Object.keys(PHASE_DESCRIPTIONS) as NonNullable<
      AgentPrivateAction["phase"]
    >[]) {
      if (!raw.phase.available.includes(phase)) continue;
      builder.add({
        kind: "phase",
        llmDescription: PHASE_DESCRIPTIONS[phase],
        phase,
      });
    }
  }

  for (const zone of raw.zones) {
    builder.add({
      kind: "select_place",
      llmDescription: `Select ${describeZone(zone)} as the placement zone.`,
      selector: zoneSelector(zone),
      debug: zone,
    });
  }

  for (const option of raw.options) {
    builder.add({
      kind: "select_option",
      llmDescription: `Choose option: ${option.text}.`,
      selector: option.response
        ? `[data-testid="duel-option-item"][data-option-response="${attrValue(
            option.response,
          )}"]:visible`
        : '[data-testid="duel-option-item"]:visible',
      debug: option,
    });
  }

  for (const position of raw.positions) {
    builder.add({
      kind: "select_position",
      llmDescription: `Choose ${position.position} position.`,
      selector: `[data-testid="duel-position-option"][data-position="${attrValue(
        position.position,
      )}"]:visible`,
      debug: position,
    });
  }

  for (const card of raw.selectCards) {
    builder.add({
      kind: "select_card",
      llmDescription: `Select ${knownCardName(
        card,
      )} from the card selection dialog.`,
      selector: selectCardSelector(card),
      debug: card,
    });
  }

  if (raw.yesVisible) {
    builder.add({
      kind: "select_yesno",
      llmDescription: "Choose Yes.",
      answer: "yes",
    });
  }

  if (raw.noVisible) {
    builder.add({
      kind: "select_yesno",
      llmDescription: "Choose No.",
      answer: "no",
    });
  }

  builder.add({
    kind: "wait",
    llmDescription: "Wait briefly and observe the duel again.",
  });

  return builder.actions.map((action, index) => ({
    id: `a_${String(index + 1).padStart(3, "0")}`,
    ...action,
    observationSummary: observation.summary,
  }));
}

export function toLegalActions(
  privateActions: AgentPrivateAction[],
): LlmVisibleAction[] {
  return privateActions.map((action) => ({
    id: action.id,
    description: action.llmDescription,
  }));
}

class ActionBuilder {
  actions: NewAgentPrivateAction[] = [];

  add(action: NewAgentPrivateAction): void {
    this.actions.push(action);
  }
}

function describeCardAction(action: string, card: RawActionCard): string {
  const verb = CARD_ACTION_DESCRIPTIONS[action] ?? action;
  const name = knownCardName(card);
  const zone = describeCardLocation(card);

  if (action === "SSET")
    return `Set ${name} from ${zone} to your Spell & Trap Zone.`;
  if (action === "MSET")
    return `Set ${name} from ${zone} to your Monster Zone.`;
  if (action === "SUMMON") return `Normal Summon ${name} from ${zone}.`;
  if (action === "SP_SUMMON") return `Special Summon ${name} from ${zone}.`;
  if (action === "ACTIVATE") return `Activate ${name} from ${zone}.`;
  if (action === "ATTACK") return `Attack with ${name}.`;

  return `${verb} ${name} from ${zone}.`;
}

function describeCardLocation(card: RawActionCard): string {
  if (card.zone === "HAND") return "your hand";
  if (card.zone === "MZONE") return "the Monster Zone";
  if (card.zone === "SZONE") return "the Spell & Trap Zone";
  if (card.zone === "GRAVE") return "the Graveyard";
  if (card.zone === "REMOVED") return "banishment";
  if (card.zone === "EXTRA") return "the Extra Deck";
  return `zone ${card.zone ?? "unknown"}`;
}

function describeZone(zone: RawActionZone): string {
  const owner = zone.controller === "0" ? "your" : "the opponent's";
  const kind =
    zone.zone === "MZONE"
      ? "Monster Zone"
      : zone.zone === "SZONE"
      ? "Spell & Trap Zone"
      : zone.zone;
  return `${owner} ${kind} ${zone.sequence}`;
}

function knownCardName(card: RawActionCard | RawSelectCardOption): string {
  return card.code && card.code !== "0" ? `card #${card.code}` : "unknown card";
}

function cardSelector(card: RawActionCard): string {
  return `[data-testid="duel-card"][data-card-uuid="${attrValue(card.uuid)}"]`;
}

function zoneSelector(zone: RawActionZone): string {
  return [
    '[data-testid="duel-zone"]',
    `[data-zone="${attrValue(zone.zone)}"]`,
    `[data-controller="${attrValue(zone.controller)}"]`,
    `[data-sequence="${attrValue(zone.sequence)}"]`,
  ].join("");
}

function selectCardSelector(card: RawSelectCardOption): string {
  const parts = ['[data-testid="duel-select-card-option"]'];

  if (card.code) parts.push(`[data-card-code="${attrValue(card.code)}"]`);
  if (card.controller)
    parts.push(`[data-card-controller="${attrValue(card.controller)}"]`);
  if (card.zone) parts.push(`[data-card-zone="${attrValue(card.zone)}"]`);
  if (card.sequence)
    parts.push(`[data-card-sequence="${attrValue(card.sequence)}"]`);

  return `${parts.join("")}:visible`;
}

function attrValue(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}
