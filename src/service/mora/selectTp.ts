import { ygopro } from "@/api";
import { eventbus, Task } from "@/infra";
import { RoomStage, roomStore, SideStage, sideStore } from "@/stores";

export default function handleSelectTp(_: ygopro.YgoStocMsg) {
  if (sideStore.stage !== SideStage.NONE) {
    sideStore.stage = SideStage.TP_SELECTING;
  } else {
    roomStore.stage = RoomStage.TP_SELECTING;
    eventbus.emit(Task.Tp);
  }
}
