import { fetchStrings, Region, ygopro } from "@/api";
import { displayEndModal } from "@/ui/Duel/Message";
import MsgWin = ygopro.StocGameMessage.MsgWin;
import { Container } from "@/container";
import { AudioActionType, changeScene } from "@/infra/audio";

export default async (container: Container, win: MsgWin) => {
  const context = container.context;
  const { win_player, reason } = win;

  await displayEndModal(
    context.matStore.isMe(win_player),
    fetchStrings(Region.Victory, `0x${reason.toString(16)}`),
  );

  if (context.matStore.isMe(win_player)) {
    changeScene(AudioActionType.BGM_WIN);
  } else {
    changeScene(AudioActionType.BGM_LOSE);
  }
};
