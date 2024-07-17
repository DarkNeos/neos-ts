import { ygopro } from "@/api";
import { Container } from "@/container";
import { showWaiting } from "@/ui/Duel/Message";

export default (
  container: Container,
  _wait: ygopro.StocGameMessage.MsgWait,
) => {
  for (const card of container.context.cardStore.inner) {
    card.idleInteractivities = [];
  }
  showWaiting(true);
};
