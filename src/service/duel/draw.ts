import { fetchCard, ygopro } from "@/api";
import { cardStore, fetchEsHintMeta } from "@/stores";

export default async (draw: ygopro.StocGameMessage.MsgDraw) => {
  fetchEsHintMeta({ originMsg: "玩家抽卡时" });

  const drawLength = draw.cards.length;

  // 将卡从卡组移到手牌：设置zone、occupant、sequence
  const handsLength = cardStore.at(ygopro.CardZone.HAND, draw.player).length;
  cardStore
    .at(ygopro.CardZone.DECK, draw.player)
    .slice(-drawLength)
    .forEach(async (card, idx) => {
      const code = draw.cards[idx];
      const meta = await fetchCard(code);
      card.code = code;
      card.meta = meta;
      card.zone = ygopro.CardZone.HAND;
      card.sequence = idx + handsLength;
    });
  // 抽卡动画
  cardStore
    .at(ygopro.CardZone.HAND, draw.player)
    .forEach((card) => eventBus.emit(Report.Move, card.uuid));
  // FIXME: `eventBus.emit`的方式能保证动画完成后才进行下一次msg的处理么
  // 如果下一次msg来得很快，可能会有动画冲突？
};
