import { ygopro } from "@/api";
import { Container } from "@/container";
import { SideStage } from "@/stores";
export function handleWaitingSide(
  container: Container,
  _: ygopro.StocWaitingSide,
) {
  container.context.sideStore.stage = SideStage.WAITING;
}
