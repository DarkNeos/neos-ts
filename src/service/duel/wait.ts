import { ygopro } from "@/api";
import {
  clearAllIdleInteractivities as clearAllIdleInteractivities,
  matStore,
} from "@/stores";

export default (_wait: ygopro.StocGameMessage.MsgWait) => {
  clearAllIdleInteractivities(0);
  clearAllIdleInteractivities(1);
  matStore.waiting = true;
};
