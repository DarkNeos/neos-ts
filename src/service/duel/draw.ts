import { fetchCard, ygopro } from "@/api";
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";
import { duelAnimation } from "@/infra/duelAnimation";
import { presentationDelay } from "@/infra/presentationDelay";
import { registerDuelDialogReset } from "@/stores/duelDialogs";
import { callCardMove } from "@/ui/Duel/PlayMat/Card";

import { fetchEsHintMeta } from "./util";

export default async (
  container: Container,
  draw: ygopro.StocGameMessage.MsgDraw,
) => {
  const context = container.context;
  fetchEsHintMeta({ context, originMsg: "玩家抽卡时" });

  const drawLength = draw.cards.length;

  // 将卡从卡组移到手牌：设置zone、occupant、sequence
  const handsLength = context.cardStore.at(
    ygopro.CardZone.HAND,
    draw.player,
  ).length;
  const newHands = context.cardStore
    .at(ygopro.CardZone.DECK, draw.player)
    .sort((a, b) => a.location.sequence - b.location.sequence)
    .slice(-drawLength);

  for (const idx in newHands) {
    const card = newHands[Number(idx)];
    const code = draw.cards[idx];
    const meta = fetchCard(code);
    card.code = code;
    card.meta = meta;
    card.location.zone = ygopro.CardZone.HAND;
    card.location.sequence = Number(idx) + handsLength;
  }

  playEffect(AudioActionType.SOUND_DRAW);

  // 抽卡动画
  const controller = new AbortController();
  const unregister = registerDuelDialogReset(() => controller.abort());
  try {
    await Promise.all(
      context.cardStore
        .at(ygopro.CardZone.HAND, draw.player)
        .map(async (card) => {
          const index = newHands.findIndex((drawn) => drawn.uuid === card.uuid);
          if (index > 0)
            await presentationDelay(
              index * duelAnimation.drawStagger,
              controller.signal,
            );
          if (!controller.signal.aborted && !container.conn.isClosed())
            await callCardMove(card.uuid);
        }),
    );
  } finally {
    unregister();
  }
};
