import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";

export default (
  hint: ygopro.StocGameMessage.MsgHint,
  dispatch: AppDispatch
) => {
  // TODO
  console.log(hint);
};
