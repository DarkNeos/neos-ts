import { ygopro } from "@/api";
import { AudioActionType, playEffect } from "@/infra/audio";
import { cardStore } from "@/stores";

export default (shuffleDeck: ygopro.StocGameMessage.MsgShuffleDeck) => {
  playEffect(AudioActionType.SOUND_SHUFFLE);
  const player = shuffleDeck.player;
  for (const card of cardStore.at(ygopro.CardZone.DECK, player)) {
    // 把数据抹掉就好了
    card.code = 0;
    card.meta = { id: 0, data: {}, text: {} };
  }
};
