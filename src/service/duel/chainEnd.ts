import { ygopro } from "@/api";
import { Container } from "@/container";

export default (
  container: Container,
  _chainEnd: ygopro.StocGameMessage.MsgChainEnd,
) => {
  console.info(`<ChainEnd>chain has been end`);
  const context = container.context;

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

  // 目前selected字段只会涉及连锁过程某些卡成为效果对象，
  // 因此在连锁结束的时候把selected标记清掉。
  //
  // TODO: 这里每次都要全部遍历一遍，后续可以优化下
  for (const card of context.cardStore.inner) {
    card.targeted = false;
  }
};
