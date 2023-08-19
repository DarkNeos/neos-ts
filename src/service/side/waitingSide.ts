import { ygopro } from "@/api";
import { SideStage, sideStore } from "@/stores";
export function handleWaitingSide(_: ygopro.StocWaitingSide) {
  sideStore.stage = SideStage.WAITING;
}
