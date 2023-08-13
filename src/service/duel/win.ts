import { fetchStrings, Region, ygopro } from "@/api";
import { matStore } from "@/stores";
import { displayEndModal } from "@/ui/Duel/Message";
import MsgWin = ygopro.StocGameMessage.MsgWin;

export default async (win: MsgWin) => {
  const { win_player, reason } = win;

  await displayEndModal(
    matStore.isMe(win_player),
    fetchStrings(Region.Victory, `0x${reason.toString(16)}`)
  );
};
