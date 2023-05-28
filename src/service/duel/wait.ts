import { ygopro } from "@/api";
import {
  cardStore,
  matStore,
} from "@/stores";

export default (_wait: ygopro.StocGameMessage.MsgWait) => {
  for (const card of cardStore.inner) {
    card.idleInteractivities = [];
  }
  matStore.waiting = true;
};
