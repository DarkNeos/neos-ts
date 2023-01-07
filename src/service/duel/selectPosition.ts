import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import MsgSelectPosition = ygopro.StocGameMessage.MsgSelectPosition;

export default (selectPosition: MsgSelectPosition, dispatch: AppDispatch) => {
  console.log(selectPosition);
};
