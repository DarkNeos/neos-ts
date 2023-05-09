import { ygopro } from "@/api";
import { matStore } from "@/stores";

type MsgShuffleHand = ygopro.StocGameMessage.MsgShuffleHand;

export default (shuffleHand: MsgShuffleHand) => {
  const { hands: codes, player: controller } = shuffleHand;

  const indexMap = new Map(codes.map((code, idx) => [code, idx]));

  matStore.hands.of(controller).sort((a, b) => {
    const indexA = indexMap.get(a.occupant?.id ?? 0) ?? 0;
    const indexB = indexMap.get(b.occupant?.id ?? 0) ?? 0;

    return indexA - indexB;
  });
};
