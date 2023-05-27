import { sleep } from "@/infra";
import { fetchCard, ygopro } from "@/api";
import { fetchEsHintMeta, matStore, cardStore } from "@/stores";
import { zip } from "@/ui/Duel/utils";
import { ReportEnum } from "@/ui/Duel/NewPlayMat/Card/springs/types";

export default async (draw: ygopro.StocGameMessage.MsgDraw) => {
  fetchEsHintMeta({ originMsg: "玩家抽卡时" });

  const deckLength = matStore.decks.of(draw.player).length;
  const drawLength = draw.cards.length;
  const popCards = matStore.decks
    .of(draw.player)
    .splice(deckLength - drawLength, drawLength);

  const data = zip(popCards, draw.cards).map(([pop, hand]) => {
    return { uuid: pop.uuid, id: hand };
  });

  matStore.hands
    .of(draw.player)
    .add(data, ygopro.CardPosition.FACEUP_ATTACK, true);

  await sleep(500);

  for (const hand of matStore.hands.of(draw.player)) {
    hand.focus = false;
  }

  // 将卡从卡组移到手牌：设置zone、occupant、sequence
  const handsLength = cardStore.at(ygopro.CardZone.HAND, draw.player).length;
  cardStore
    .at(ygopro.CardZone.DECK, draw.player)
    .slice(-drawLength)
    .forEach(async (card, idx) => {
      card.zone = ygopro.CardZone.HAND;
      card.code = draw.cards[idx];
      card.sequence = idx + handsLength;
    });
  // 抽卡动画
  cardStore
    .at(ygopro.CardZone.HAND, draw.player)
    .forEach((card) => eventBus.emit(ReportEnum.Move, card.uuid));
};
