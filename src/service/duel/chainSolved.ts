import { ygopro } from "@/api";
import { matStore } from "@/stores";

export default (chainSolved: ygopro.StocGameMessage.MsgChainSolved) => {
  const location = matStore.chains
    .splice(chainSolved.solved_index - 1, 1)
    .at(0);
  if (location) {
    // 设置被连锁状态为空
    matStore.setChained(location, undefined);
  } else {
    console.warn("pop from chains return null!");
  }
};
