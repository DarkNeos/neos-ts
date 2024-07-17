import { ygopro } from "@/api";
import { Container } from "@/container";

export default (
  container: Container,
  lpUpdate: ygopro.StocGameMessage.MsgLpUpdate,
) => {
  const player = lpUpdate.player;
  const newLp = lpUpdate.new_lp;
  container.context.matStore.initInfo.of(player).life = newLp;
};
