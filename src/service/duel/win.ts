import { ygopro } from "@/api";
import { matStore } from "@/stores";
import MsgWin = ygopro.StocGameMessage.MsgWin;

export default (win: MsgWin) => {
  const player = win.player;
  if (matStore.isMe(player)) {
    matStore.result = win.type_;
  } else {
    matStore.result =
      win.type_ == MsgWin.ActionType.Win
        ? MsgWin.ActionType.Defeated
        : MsgWin.ActionType.Win;
  }
};
