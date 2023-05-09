import { sendTimeConfirm, ygopro } from "@/api";
import { matStore } from "@/stores";

const TIME_GAP = 200; // TODO: use config

export default function handleTimeLimit(timeLimit: ygopro.StocTimeLimit) {
  setTimeout(() => {
    matStore.timeLimits.set(timeLimit.player, timeLimit.left_time);
    sendTimeConfirm();
  }, TIME_GAP);
}
