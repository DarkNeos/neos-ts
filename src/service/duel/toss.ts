import { fetchStrings, ygopro } from "@/api";
import { matStore } from "@/stores";
import MsgToss = ygopro.StocGameMessage.MsgToss;

export default (toss: MsgToss) => {
  const tossType = toss.toss_type;

  for (const x of toss.res) {
    if (tossType == MsgToss.TossType.DICE) {
      matStore.tossResult = fetchStrings("!system", 1624) + x;
    } else if (tossType == MsgToss.TossType.COIN) {
      matStore.tossResult =
        fetchStrings("!system", 1623) + fetchStrings("!system", 60 + x);
    } else {
      console.log(`Unknown tossType = ${tossType}`);
    }
  }
};
