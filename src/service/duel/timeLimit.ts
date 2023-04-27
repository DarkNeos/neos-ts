import { sendTimeConfirm, ygopro } from "@/api";
import { matStore } from "@/stores";

export default function handleTimeLimit(timeLimit: ygopro.StocTimeLimit) {
  matStore.timeLimits.set(timeLimit.player, timeLimit.left_time);
  sendTimeConfirm();
}
