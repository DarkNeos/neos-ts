import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { setCheckCounter } from "../../reducers/duel/mod";
import { AppDispatch } from "../../store";
import MsgSelectCounter = ygopro.StocGameMessage.MsgSelectCounter;

export default (selectCounter: MsgSelectCounter, dispatch: AppDispatch) => {
  dispatch(setCheckCounter(selectCounter.toObject()));
};
