import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { updateFieldData } from "../../reducers/duel/mod";
import { AppDispatch } from "../../store";
import MsgUpdateData = ygopro.StocGameMessage.MsgUpdateData;

export default (updateData: MsgUpdateData, dispatch: AppDispatch) => {
  dispatch(updateFieldData(updateData.toObject()));
};
