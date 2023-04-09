import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { clearAllIdleInteractivities, setWaiting } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";

export default (
  _wait: ygopro.StocGameMessage.MsgWait,
  dispatch: AppDispatch
) => {
  dispatch(clearAllIdleInteractivities(0));
  dispatch(clearAllIdleInteractivities(1));
  dispatch(setWaiting(true));
};
