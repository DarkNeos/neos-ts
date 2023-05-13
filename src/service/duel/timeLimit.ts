import { sendTimeConfirm, ygopro } from "@/api";
import { useConfig } from "@/config";
import { matStore } from "@/stores";

export default function handleTimeLimit(timeLimit: ygopro.StocTimeLimit) {
  setTimeout(() => {
    matStore.timeLimits.set(timeLimit.player, timeLimit.left_time);
    sendTimeConfirm();
  }, useConfig().ui.commonDelay);
}
