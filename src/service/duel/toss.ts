import { fetchStrings, Region, ygopro } from "@/api";
import { sleep } from "@/infra";
import { matStore } from "@/stores";
import MsgToss = ygopro.StocGameMessage.MsgToss;

export default async (toss: MsgToss) => {
  const player = toss.player;
  const tossType = toss.toss_type;

  const prefix = fetchStrings(Region.System, matStore.isMe(player) ? 102 : 103);

  for (const x of toss.res) {
    if (tossType === MsgToss.TossType.DICE) {
      matStore.tossResult = prefix + fetchStrings(Region.System, 1624) + x;
    } else if (tossType === MsgToss.TossType.COIN) {
      matStore.tossResult =
        prefix +
        fetchStrings(Region.System, 1623) +
        fetchStrings(Region.System, 61 - x);
    } else {
      console.log(`Unknown tossType = ${tossType}`);
    }

    // 等待1s，不然多个结果刷新太快了
    await sleep(1000);
  }
};
