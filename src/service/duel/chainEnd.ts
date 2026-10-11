import { ygopro } from "@/api";
import { Container } from "@/container";

export default (
  container: Container,
  _chainEnd: ygopro.StocGameMessage.MsgChainEnd,
) => {
  console.info(`<ChainEnd>chain has been end`);
  const context = container.context;
  context.matStore.chainCards = [];

  while (true) {
    const chain = context.matStore.chains.pop();
    if (chain === undefined) {
      break;
    }

    const block = context.placeStore.of(context, chain);
    if (block) {
      block.chainIndex.pop();
    } else {
      console.warn(`<ChainEnd>block from ${chain} is null`);
    }
  }

  // targeted 表示本次连锁的效果对象，连锁结束时清除，独立于玩家选卡的蓝框。
  //
  // TODO: 这里每次都要全部遍历一遍，后续可以优化下
  for (const card of context.cardStore.inner) {
    card.targeted = false;
  }
};
