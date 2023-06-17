import { ygopro } from "@/api";
import MsgToss = ygopro.StocGameMessage.MsgToss;

export default (toss: MsgToss) => {
  const tossType = toss.toss_type;

  for (const x of toss.res) {
    if (tossType == MsgToss.TossType.DICE) {
      console.log(`骰子结果：${x}`);
    } else if (tossType == MsgToss.TossType.COIN) {
      if (x) {
        console.log(`硬币正面`);
      } else {
        console.log(`硬币反面`);
      }
    } else {
      console.log(`Unknown tossType = ${tossType}`);
    }
  }
};
