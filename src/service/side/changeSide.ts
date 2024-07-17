import { ygopro } from "@/api";
import { Container } from "@/container";
import { SideStage } from "@/stores";
export function handleChangeSide(
  container: Container,
  _: ygopro.StocChangeSide,
) {
  container.context.sideStore.stage = SideStage.SIDE_CHANGING;
}
