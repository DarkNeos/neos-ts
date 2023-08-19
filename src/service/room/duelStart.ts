import { ygopro } from "@/api";
import { RoomStage, roomStore, SideStage, sideStore } from "@/stores";

export default function handleDuelStart(_pb: ygopro.YgoStocMsg) {
  if (sideStore.stage !== SideStage.NONE) {
    sideStore.stage = SideStage.SIDE_CHANGED;
  } else {
    roomStore.stage = RoomStage.MORA;
  }
}
