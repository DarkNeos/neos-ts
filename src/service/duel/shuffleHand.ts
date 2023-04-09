import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { updateHandsMeta } from "@/reducers/duel/handsSlice";
import { AppDispatch } from "@/store";
import MsgShuffleHand = ygopro.StocGameMessage.MsgShuffleHand;

export default (shuffleHand: MsgShuffleHand, dispatch: AppDispatch) => {
  dispatch(
    updateHandsMeta({ controler: shuffleHand.player, codes: shuffleHand.hands })
  );
};
