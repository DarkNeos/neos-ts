import { ygopro } from "@/api";
import { Container } from "@/container";

export default function handResult(
  container: Container,
  pb: ygopro.YgoStocMsg,
) {
  const msg = pb.stoc_hand_result;
  const context = container.context;
  const me = context.roomStore.getMePlayer();
  const op = context.roomStore.getOpPlayer();

  if (me && op) {
    me.moraResult = msg.meResult;
    op.moraResult = msg.opResult;
  } else if (
    context.roomStore.selfType !== ygopro.StocTypeChange.SelfType.OBSERVER
  ) {
    console.error("<HandResult>me or op is undefined");
  }
}
