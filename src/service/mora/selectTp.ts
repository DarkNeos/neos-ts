import { ygopro } from "@/api";
import { eventbus, Task } from "@/infra";
import { RoomStage, roomStore } from "@/stores";

export default function handleSelectTp(_: ygopro.YgoStocMsg) {
  roomStore.stage = RoomStage.TP_SELECTING;
  eventbus.emit(Task.Tp);
}
