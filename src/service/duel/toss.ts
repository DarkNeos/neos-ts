import { fetchStrings, ygopro } from "@/api";
import { sleep } from "@/infra";
import { matStore } from "@/stores";
import MsgToss = ygopro.StocGameMessage.MsgToss;

export default async (toss: MsgToss) => {
  const player = toss.player;
  const tossType = toss.toss_type;

  const prefix = fetchStrings("!system", matStore.isMe(player) ? 102 : 103);

  for (const x of toss.res) {
    if (tossType == MsgToss.TossType.DICE) {
      matStore.tossResult = prefix + fetchStrings("!system", 1624) + x;
    } else if (tossType == MsgToss.TossType.COIN) {
      matStore.tossResult =
        prefix +
        fetchStrings("!system", 1623) +
        fetchStrings("!system", 61 - x);
    } else {
      console.log(`Unknown tossType = ${tossType}`);
    }

    // 等待1s，不然多个结果刷新太快了
    await sleep(1000);
  }
};
