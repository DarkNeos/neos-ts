import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { store } from "../../store";
import { updateTimeLimit } from "../../reducers/duel/mod";
import { sendTimeConfirm } from "../../api/ocgcore/ocgHelper";

export default function handleTimeLimit(timeLimit: ygopro.StocTimeLimit) {
  const dispatch = store.dispatch;

  dispatch(updateTimeLimit([timeLimit.player, timeLimit.left_time]));
  sendTimeConfirm();
}
