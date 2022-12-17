import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { store } from "../../store";
import { updateTimeLimit } from "../../reducers/duel/mod";

export default function handleTimeLimit(timeLimit: ygopro.StocTimeLimit) {
  const dispatch = store.dispatch;

  dispatch(updateTimeLimit([timeLimit.player, timeLimit.left_time]));
}
