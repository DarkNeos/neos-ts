import { ygopro } from "@/api";
import { sendTimeConfirm } from "@/api/ocgcore/ocgHelper";
import { updateTimeLimit } from "@/reducers/duel/mod";
import { store } from "@/store";

import { matStore } from "@/valtioStores";

export default function handleTimeLimit(timeLimit: ygopro.StocTimeLimit) {
  const dispatch = store.dispatch;

  dispatch(updateTimeLimit([timeLimit.player, timeLimit.left_time]));

  matStore.timeLimits.set(timeLimit.player, timeLimit.left_time);

  sendTimeConfirm();
}
