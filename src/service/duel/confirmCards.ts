import { fetchCard, ygopro } from "@/api";
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";
import { duelAnimation } from "@/infra/duelAnimation";
import { presentationDelay } from "@/infra/presentationDelay";
import { type CardType, replayStore } from "@/stores";
import { registerDuelDialogReset } from "@/stores/duelDialogs";
import { displayConfirmCardsModal } from "@/ui/Duel/Message/ConfirmCardsModal";
import { callCardConfirm } from "@/ui/Duel/PlayMat/Card";

export default async (
  container: Container,
  confirmCards: ygopro.StocGameMessage.MsgConfirmCards,
) => {
  if (container.conn.cancelled) return;
  const context = container.context;
  const isDeckTop = (
    confirmCards as typeof confirmCards & { is_decktop?: boolean }
  ).is_decktop;
  // 顶部确认按牌堆最高序号起取卡，协议中的排列表示从顶端开始的顺序。
  const deck = isDeckTop
    ? context.cardStore
        .at(ygopro.CardZone.DECK, confirmCards.player)
        .slice()
        .sort((a, b) => b.location.sequence - a.location.sequence)
    : [];
  const targets: CardType[] = [];

  for (const [index, card] of confirmCards.cards.entries()) {
    const target = isDeckTop
      ? deck[index]
      : context.cardStore.at(card.location, card.controller, card.sequence);
    if (!target) {
      console.warn(`card of ${card} is null`);
      continue;
    }
    if (card.code !== 0) {
      target.code = card.code;
      target.meta = fetchCard(card.code);
    }
    targets.push(target);
    context.historyStore.putConfirmed(context, target.meta.id, target.location);
  }

  if (!targets.length || container.conn.isClosed()) return;
  const controller = new AbortController();
  // 断线或退出时取消尚未结束的展示动画，释放当前消息的等待。
  const unregister = registerDuelDialogReset(() => controller.abort());
  try {
    const { PLAYER1, PLAYER6 } = ygopro.StocTypeChange.SelfType;
    const isPlayer =
      context.matStore.selfType >= PLAYER1 &&
      context.matStore.selfType <= PLAYER6;
    if (!isDeckTop && targets.length > 3 && isPlayer && !replayStore.isReplay) {
      playEffect(AudioActionType.SOUND_REVEAL);
      // 只等待本地确认，不向服务器发送选卡响应。
      await displayConfirmCardsModal(targets);
    } else {
      await Promise.all(
        targets.map(async (target, index) => {
          // 大批量观战/录像展示限制启动间隔总长，避免恢复逐张等待。
          await presentationDelay(
            Math.min(index * duelAnimation.reveal.stagger, 320),
            controller.signal,
          );
          if (controller.signal.aborted || container.conn.isClosed()) return;
          playEffect(AudioActionType.SOUND_REVEAL);
          await callCardConfirm(target.uuid, { signal: controller.signal });
          if (target.code === 0) target.meta = { id: 0, data: {}, text: {} };
        }),
      );
    }
  } finally {
    unregister();
  }
};
