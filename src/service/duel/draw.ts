import { ygopro } from "@/api";
import { sleep } from "@/infra";
import { fetchEsHintMeta, matStore } from "@/stores";
import { zip } from "@/ui/Duel/utils";

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
};
