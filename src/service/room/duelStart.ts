import { ygopro } from "@/api";
import { Container } from "@/container";
import { RoomStage, SideStage } from "@/stores";

export default function handleDuelStart(
  container: Container,
  _pb: ygopro.YgoStocMsg,
) {
  const context = container.context;
  if (context.sideStore.stage !== SideStage.NONE) {
    context.sideStore.stage = SideStage.SIDE_CHANGED;
  } else {
    context.roomStore.stage = RoomStage.MORA;
  }
}
