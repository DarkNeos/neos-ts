import { ygopro } from "@/api";
import { matStore } from "@/stores";

type MsgShuffleHand = ygopro.StocGameMessage.MsgShuffleHand;

export default (shuffleHand: MsgShuffleHand) => {
  const { hands: codes, player: controller } = shuffleHand;

  matStore.hands.of(controller).length = 0;
  matStore.hands.of(controller).add(codes);
};
