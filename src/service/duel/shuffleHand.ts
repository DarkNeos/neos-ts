import { ygopro } from "@/api";
import { matStore } from "@/stores";
import { zip } from "@/ui/Duel/utils";

type MsgShuffleHand = ygopro.StocGameMessage.MsgShuffleHand;

export default (shuffleHand: MsgShuffleHand) => {
  const { hands: codes, player: controller } = shuffleHand;

  const uuids = matStore.hands.of(controller).map((hand) => hand.uuid);
  const data = zip(uuids, codes).map(([uuid, id]) => {
    return { uuid, id };
  });

  matStore.hands.of(controller).length = 0;
  matStore.hands.of(controller).add(data);
};
