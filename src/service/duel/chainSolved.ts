import { ygopro } from "@/api";
import { matStore, placeStore } from "@/stores";

// FIXME: 处理连锁会存在三种结果：
// 1. Solved - 已处理；
// 2. NEGATED - 被无效；
// 3. DISABLED - 被禁用。
//
// 第一种MSG后端会在每一个连锁点处理完（不管是无效还是禁用）发给前端，
// 第二第三种只会在特定情况下发，用于UI展示。
// 这里暂时只处理第一种。
export default async (chainSolved: ygopro.StocGameMessage.MsgChainSolved) => {
  console.info(`<ChainSolved>solved_index = ${chainSolved.solved_index}`);

  const location = matStore.chains
    .splice(chainSolved.solved_index - 1, 1)
    .at(0);
  if (location) {
    // 设置被连锁状态为空，解除连锁
    const block = placeStore.of(location);
    if (block) {
      block.chainIndex.pop();
    } else {
      console.warn(`<ChainSolved>block from ${location} is null`);
    }
  } else {
    console.warn(
      `pop from chains return null! solved_index=${chainSolved.solved_index},
        len of chains in store=${matStore.chains.length}`,
    );
  }
};
