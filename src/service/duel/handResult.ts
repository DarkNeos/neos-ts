import { ygopro } from "@/api";
import { matStore } from "@/stores";
import MsgHandResult = ygopro.StocGameMessage.MsgHandResult;

export default (res: MsgHandResult) => {
  const { result1, result2 } = res;

  matStore.handResults.set(0, result1);
  matStore.handResults.set(1, result2);
};
