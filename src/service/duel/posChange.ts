import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import MsgPosChange = ygopro.StocGameMessage.MsgPosChange;

export default (posChange: MsgPosChange, dispatch: AppDispatch) => {
  console.log(posChange);
};
