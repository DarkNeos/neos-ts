import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import MsgUpdateData = ygopro.StocGameMessage.MsgUpdateData;

export default (updateData: MsgUpdateData, dispatch: AppDispatch) => {
  console.log(updateData);
};
