import { ygopro } from "@/api";
import { updateHandsMeta } from "@/reducers/duel/handsSlice";
import { AppDispatch } from "@/store";
import MsgShuffleHand = ygopro.StocGameMessage.MsgShuffleHand;

import { matStore } from "@/valtioStores";

export default (shuffleHand: MsgShuffleHand, dispatch: AppDispatch) => {
  dispatch(
    updateHandsMeta({ controler: shuffleHand.player, codes: shuffleHand.hands })
  );

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

  matStore.hands.at(controller).length = 0;
  matStore.hands.at(controller).push(...metas);
};
