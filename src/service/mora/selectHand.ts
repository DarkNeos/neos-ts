import { sendHandResult, ygopro } from "@/api";
import { Container } from "@/container";
import { eventbus, Task } from "@/infra";
import { RoomStage } from "@/stores";

export default function handleSelectHand(
  container: Container,
  _: ygopro.YgoStocMsg,
) {
  const context = container.context;
  // 训练密码 SS 让 AI 固定出剪刀，玩家出石头后可直接选择先后攻。
  if (context.trainingStore.session) {
    sendHandResult(container.conn, "rock");
    context.roomStore.stage = RoomStage.HAND_SELECTED;
    return;
  }
  context.roomStore.stage = RoomStage.HAND_SELECTING;
  eventbus.emit(Task.Mora);
}
