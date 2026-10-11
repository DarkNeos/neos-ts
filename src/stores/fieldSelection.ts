import { proxy } from "valtio";

import { ygopro } from "@/api";
import type { Container } from "@/container";

import type {
  CardSelectionOption,
  CardSelectionRequest,
} from "./cardSelectionTypes";
import type { CardType } from "./cardStore";
import { duelSelection, respondToCardSelection } from "./duelSelection";

export type FieldSelectionOptions = CardSelectionRequest<CardSelectionOption>;
export const fieldSelection = proxy({ active: false, hint: "" });

/** 只在所有候选都对应独立场上卡片时点选；素材等候选交由弹窗展示。 */
export function canSelectOnField(
  container: Container,
  options: FieldSelectionOptions,
) {
  const all = [...options.selectables, ...options.mustSelects];
  return (
    all.length > 0 &&
    all.every((option) => {
      const loc = option.location;
      return (
        loc &&
        !loc.is_overlay &&
        [ygopro.CardZone.MZONE, ygopro.CardZone.SZONE].includes(loc.zone) &&
        !!container.context.cardStore.find(loc)
      );
    })
  );
}

let refreshCards: (() => void) | undefined;

export function displayFieldSelection(
  container: Container,
  options: FieldSelectionOptions,
) {
  const cards = options.selectables.map(
    (option) => container.context.cardStore.find(option.location!)!,
  );
  const mandatory = options.mustSelects.map(
    (option) => container.context.cardStore.find(option.location!)!,
  );
  const hint =
    container.context.matStore.hint.esSelectHint ||
    (options.selectionKind === "tribute" ? "请选择要解放的卡片" : "请选择卡片");
  const waiting = duelSelection.open(options, (result) => {
    for (const card of [...cards, ...mandatory])
      card.selectInfo = { selectable: false, selected: false };
    fieldSelection.active = false;
    refreshCards = undefined;
    respondToCardSelection(container, result);
  });
  container.context.cardStore.inner.forEach((card) => {
    card.idleInteractivities = [];
  });
  fieldSelection.active = true;
  fieldSelection.hint = hint;
  // 场上蓝框只投影选卡状态，实际勾选和合法性仍由共享流程管理。
  refreshCards = () => {
    cards.forEach((card, index) => {
      const option = options.selectables[index];
      card.selectInfo = {
        selected:
          !!option.selected || duelSelection.state.selected.includes(index),
        selectable: !option.selected && duelSelection.canChoose(index),
        response: option.response,
      };
    });
    for (const card of mandatory)
      card.selectInfo = { selected: true, selectable: false };
  };
  refreshCards();
  return waiting;
}

/** 消费整个选卡期间的场上点击，避免触发普通操作菜单。 */
export function toggleFieldSelection(
  card: CardType,
  inspect: (card: CardSelectionOption | CardType) => void,
) {
  if (!fieldSelection.active) return false;
  const options = duelSelection.state.request;
  const matchesCard = (option: CardSelectionOption) => {
    const loc = option.location;
    return (
      loc &&
      loc.controller === card.location.controller &&
      loc.zone === card.location.zone &&
      loc.sequence === card.location.sequence &&
      !!loc.is_overlay === !!card.location.is_overlay &&
      (!loc.is_overlay ||
        loc.overlay_sequence === card.location.overlay_sequence)
    );
  };
  const index = options?.selectables.findIndex(matchesCard) ?? -1;
  // 必选卡和暂时不可选的卡也能查看；协议公开的候选身份优先于场上缓存。
  inspect(
    options?.selectables[index] ??
      options?.mustSelects.find(matchesCard) ??
      card,
  );
  if (index < 0 || !duelSelection.canChoose(index)) return true;
  duelSelection.toggle(index);
  if (options?.single) duelSelection.submit();
  else refreshCards?.();
  return true;
}

export function submitFieldSelection() {
  duelSelection.submit();
}
export function cancelFieldSelection() {
  duelSelection.cancel();
}
export function finishFieldSelection() {
  duelSelection.finishSelection();
}
export function getFieldSelectionOptions() {
  return fieldSelection.active ? duelSelection.state.request : undefined;
}
