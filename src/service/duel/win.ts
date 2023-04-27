import { ygopro } from "@/api";
import { matStore } from "@/stores";

export default (win: ygopro.StocGameMessage.MsgWin) => {
  matStore.result = win.type_;
};
