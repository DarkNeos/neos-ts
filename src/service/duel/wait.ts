import { ygopro } from "@/api";
import { cardStore } from "@/stores";
import { showWaiting } from "@/ui/Duel/Message";

export default (_wait: ygopro.StocGameMessage.MsgWait) => {
  for (const card of cardStore.inner) {
    card.idleInteractivities = [];
  }
  showWaiting(true);
};
