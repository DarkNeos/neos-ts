import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import MsgShuffleHand = ygopro.StocGameMessage.MsgShuffleHand;

export default (shuffleHand: MsgShuffleHand, dispatch: AppDispatch) => {
  console.log(shuffleHand);
};
