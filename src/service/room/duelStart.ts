import { ygopro } from "@/api";
import { RoomStage, roomStore } from "@/stores";

export default function handleDuelStart(_pb: ygopro.YgoStocMsg) {
  roomStore.stage = RoomStage.MORA;
}
