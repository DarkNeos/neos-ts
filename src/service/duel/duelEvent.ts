import { ygopro } from "@/api";
import type { DuelEvent } from "@/api/ocgcore/ocgAdapter/duelEvent";
import type { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";
import { duelAnimation } from "@/infra/duelAnimation";
import { presentationDelay } from "@/infra/presentationDelay";

import battle from "./battle";

/** ADD/REMOVE 带引用计数；重复添加后移除一次不能提前隐藏提示。 */
function updateDescription(
  hints: Record<number, number>,
  type: number,
  value: number,
) {
  if (type !== 6 && type !== 7) return;
  const count = (hints[value] ?? 0) + (type === 6 ? 1 : -1);
  if (count > 0) hints[value] = count;
  else delete hints[value];
}

export default async (container: Container, event: DuelEvent) => {
  const { cardStore, matStore, historyStore } = container.context;
  if (event.kind === "card-hint") {
    const card = cardStore.find(event.location);
    if (!card) return;
    if (event.type === 6 || event.type === 7) {
      card.descriptionHints ??= {};
      updateDescription(card.descriptionHints, event.type, event.value);
    } else if (event.type >= 1 && event.type <= 5) {
      card.hint = event.value
        ? { type: event.type, value: event.value }
        : undefined;
    }
  } else if (event.kind === "player-hint") {
    if (event.player < 0 || event.player > 1) return;
    matStore.playerHints[event.player] ??= {};
    updateDescription(
      matStore.playerHints[event.player],
      event.type,
      event.value,
    );
  } else if (event.kind === "battle") {
    await battle(container, event);
  } else if (event.kind === "damage-step") {
    matStore.phase.currentPhase = event.start
      ? ygopro.StocGameMessage.MsgNewPhase.PhaseType.DAMAGE
      : ygopro.StocGameMessage.MsgNewPhase.PhaseType.BATTLE_STEP;
    if (!event.start) matStore.clearAttack();
  } else if (event.kind === "chain-stage") {
    const entry = matStore.chainCards[event.index - 1];
    if (!entry || entry.solved) return;
    if (event.stage === "built") {
      entry.building = true;
      // 短闪与发动收回并行，不另加协议等待。
      void presentationDelay(duelAnimation.chain.built).then(() => {
        entry.building = false;
      });
    } else {
      for (const item of matStore.chainCards) item.resolving = false;
      entry.building = false;
      entry.resolving = true;
      await presentationDelay(duelAnimation.chain.solving);
    }
  } else if (event.kind === "chain-result") {
    const entry = matStore.chainCards[event.index - 1];
    if (!entry || entry.negated === event.result) return;
    entry.negated = event.result;
    const text = `连锁 ${event.index}：${
      event.result === "activation" ? "发动无效" : "效果无效"
    }`;
    matStore.hint.esHint = text;
    historyStore.putHint(container.context, entry.controller, text, entry.code);
    playEffect(AudioActionType.SOUND_INFO);
    const wasResolving = entry.resolving;
    entry.resolving = true;
    if (!wasResolving) await presentationDelay(duelAnimation.chain.solving);
  }
};
