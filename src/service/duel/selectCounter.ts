import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import MsgSelectCounter = ygopro.StocGameMessage.MsgSelectCounter;

export default (selectCounter: MsgSelectCounter, dispatch: AppDispatch) => {
  console.log(selectCounter);
};
