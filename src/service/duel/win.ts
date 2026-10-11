import { fetchStrings, Region, ygopro } from "@/api";
import { resetDuelDialogs } from "@/stores/duelDialogs";
import { displayEndModal } from "@/ui/Duel/Message";
import MsgWin = ygopro.StocGameMessage.MsgWin;
import { Container } from "@/container";
import { AudioActionType, changeScene } from "@/infra/audio";
import { replayStore } from "@/stores/replayStore";

export default async (container: Container, win: MsgWin) => {
  const context = container.context;
  context.matStore.deckReserved = false;
  context.matStore.chainCards = [];
  context.matStore.stopClock();
  const { win_player, reason } = win;

  const isWin = context.matStore.isMe(win_player);
  changeScene(isWin ? AudioActionType.BGM_WIN : AudioActionType.BGM_LOSE);
  resetDuelDialogs();
  if (context.trainingStore.savingReplay) return;
  if (replayStore.isReplay) {
    if (!replayStore.seeking)
      void displayEndModal(
        isWin,
        fetchStrings(Region.Victory, `0x${reason.toString(16)}`),
      );
    return;
  }
  await displayEndModal(
    isWin,
    fetchStrings(Region.Victory, `0x${reason.toString(16)}`),
  );
};
