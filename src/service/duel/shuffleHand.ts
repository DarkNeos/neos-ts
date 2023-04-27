import { ygopro } from "@/api";
import { matStore } from "@/stores";

type MsgShuffleHand = ygopro.StocGameMessage.MsgShuffleHand;

export default (shuffleHand: MsgShuffleHand) => {
  const { hands: codes, player: controller } = shuffleHand;

  const metas = codes.map((code) => {
    return {
      occupant: { id: code, data: {}, text: {} },
      location: {
        controler: controller,
        location: ygopro.CardZone.HAND,
      },
      idleInteractivities: [],
      counters: {},
    };
  });

  matStore.hands.of(controller).length = 0;
  matStore.hands.of(controller).push(...metas);
};
