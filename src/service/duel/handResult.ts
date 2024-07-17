import { ygopro } from "@/api";
import MsgHandResult = ygopro.StocGameMessage.MsgHandResult;
import { Container } from "@/container";

export default (container: Container, res: MsgHandResult) => {
  const context = container.context;
  const { result1, result2 } = res;

  context.matStore.handResults.set(0, result1);
  context.matStore.handResults.set(1, result2);
};
