import { ygopro } from "@/api";
import { clearAllIdleInteractivities, setWaiting } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";
import {
  clearAllIdleInteractivities as FIXME_clearAllIdleInteractivities,
  matStore,
} from "@/valtioStores";

export default (
  _wait: ygopro.StocGameMessage.MsgWait,
  dispatch: AppDispatch
) => {
  // dispatch(clearAllIdleInteractivities(0));
  // dispatch(clearAllIdleInteractivities(1));
  // dispatch(setWaiting(true));

  FIXME_clearAllIdleInteractivities(0);
  FIXME_clearAllIdleInteractivities(1);
  matStore.waiting = true;
};
