import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import MsgReloadField = ygopro.StocGameMessage.MsgReloadField;

export default (reloadField: MsgReloadField, dispatch: AppDispatch) => {
  console.log(reloadField);
};
