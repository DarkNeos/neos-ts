import { sendTpResult, ygopro } from "@/api";
import { Container } from "@/container";
import { eventbus, Task } from "@/infra";
import { RoomStage, SideStage } from "@/stores";

export default function handleSelectTp(
  container: Container,
  _: ygopro.YgoStocMsg,
) {
  const context = container.context;
  // 训练沿用开始前选择的先后攻，普通对局继续显示手动选择界面。
  const training = context.trainingStore.session;
  if (training) {
    sendTpResult(container.conn, training.first);
    context.roomStore.stage = RoomStage.TP_SELECTED;
    return;
  }
  if (context.sideStore.stage !== SideStage.NONE) {
    context.sideStore.stage = SideStage.TP_SELECTING;
  } else {
    context.roomStore.stage = RoomStage.TP_SELECTING;
    eventbus.emit(Task.Tp);
  }
}
