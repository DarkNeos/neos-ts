import { ygopro } from "@/api";
import { Container } from "@/container";
import { eventbus, Task } from "@/infra";
import { RoomStage } from "@/stores";

export default function handleSelectHand(
  container: Container,
  _: ygopro.YgoStocMsg,
) {
  const context = container.context;
  context.roomStore.stage = RoomStage.HAND_SELECTING;
  eventbus.emit(Task.Mora);
}
