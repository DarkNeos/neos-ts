import { ygopro } from "@/api";
import { eventbus, Task } from "@/infra";
import { RoomStage, roomStore } from "@/stores";

export default function handleSelectHand(_: ygopro.YgoStocMsg) {
  roomStore.stage = RoomStage.HAND_SELECTING;
  eventbus.emit(Task.Mora);
}
