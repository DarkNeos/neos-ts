import { ygopro } from "@/api";
import { cardStore, matStore } from "@/stores";

export default (_chainEnd: ygopro.StocGameMessage.MsgChainEnd) => {
  while (true) {
    const chain = matStore.chains.pop();
    if (chain === undefined) {
      break;
    }

    // const target = cardStore.find(chain);
    // if (target) {
    //   target.chainIndex = undefined;
    // } else {
    //   console.warn(`<ChainEnd>target from ${chain} is null`);
    // }
  }

  // 目前selected字段只会涉及连锁过程某些卡成为效果对象，
  // 因此在连锁结束的时候把selected标记清掉。
  //
  // TODO: 这里每次都要全部遍历一遍，后续可以优化下
  for (const card of cardStore.inner) {
    card.selected = false;
  }
};
