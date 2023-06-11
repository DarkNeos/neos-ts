import { fetchStrings, ygopro } from "@/api";
import { matStore } from "@/stores";
import MsgWin = ygopro.StocGameMessage.MsgWin;

export default (win: MsgWin) => {
  const { win_player, reason } = win;
  matStore.result = {
    isWin: matStore.isMe(win_player),
    reason: fetchStrings("!victory", reason),
  };
};
