import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { reloadField } from "../../reducers/duel/mod";
import { AppDispatch } from "../../store";
import MsgReloadField = ygopro.StocGameMessage.MsgReloadField;

export default (field: MsgReloadField, dispatch: AppDispatch) => {
  dispatch(reloadField(field));
};
