import { ygopro } from "@/api";
import { Container } from "@/container";

export default function handResult(
  container: Container,
  pb: ygopro.YgoStocMsg,
) {
  const msg = pb.stoc_hand_result;
  const context = container.context;
  // 验证固定猜拳确实由服务器执行，否则后续无法保证玩家选择先后攻。
  if (
    context.trainingStore.session &&
    (msg.meResult !== ygopro.HandType.ROCK ||
      msg.opResult !== ygopro.HandType.SCISSORS)
  ) {
    const error =
      "服务器没有按训练规则固定猜拳，训练已停止，请更换服务器后重试";
    context.trainingStore.error = error;
    context.roomStore.errorMsg = error;
    throw new Error(error);
  }
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
