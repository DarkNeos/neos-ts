import { sendTimeConfirm, ygopro } from "@/api";
import { matStore } from "@/stores";

const TIME_GAP = 800;

export default function handleTimeLimit(timeLimit: ygopro.StocTimeLimit) {
  setTimeout(() => {
    matStore.timeLimits.set(timeLimit.player, timeLimit.left_time);
    sendTimeConfirm();
  }, TIME_GAP);
}
