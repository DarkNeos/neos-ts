import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";

export default (
  selectIdleCmd: ygopro.StocGameMessage.MsgSelectIdleCmd,
  dispatch: AppDispatch
) => {
  // TODO
  console.log(selectIdleCmd);
};
