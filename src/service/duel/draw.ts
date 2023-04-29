import { ygopro } from "@/api";
import { fetchEsHintMeta, matStore } from "@/stores";
import { zip } from "@/ui/Duel/utils";

export default (draw: ygopro.StocGameMessage.MsgDraw) => {
  fetchEsHintMeta({ originMsg: "玩家抽卡时" });

  const deckLength = matStore.decks.of(draw.player).length;
  const drawLength = draw.cards.length;
  const popCards = matStore.decks
    .of(draw.player)
    .slice(deckLength - drawLength, drawLength);

  const data = zip(popCards, draw.cards).map(([pop, hand]) => {
    return { uuid: pop.uuid, id: hand };
  });

  matStore.hands.of(draw.player).add(data);
};
