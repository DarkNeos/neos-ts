import { ygopro } from "@/api";
import { SideStage, sideStore } from "@/stores";
export function handleChangeSide(_: ygopro.StocChangeSide) {
  sideStore.stage = SideStage.SIDE_CHANGING;
}
