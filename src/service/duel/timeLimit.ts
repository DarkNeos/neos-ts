import { sendTimeConfirm, ygopro } from "@/api";
import { Container } from "@/container";
import { matStore } from "@/stores";

export default function handleTimeLimit(
  container: Container,
  timeLimit: ygopro.StocTimeLimit,
) {
  matStore.timeLimits.set(timeLimit.player, timeLimit.left_time);
  if (matStore.isMe(timeLimit.player)) {
    sendTimeConfirm(container.conn);
  }
}
