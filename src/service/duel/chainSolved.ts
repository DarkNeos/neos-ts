import { ygopro } from "@/api";
import { sleep } from "@/infra";
import { matStore } from "@/stores";

// FIXME: 处理连锁会存在三种结果：
// 1. Solved - 已处理；
// 2. NEGATED - 被无效；
// 3. DISABLED - 被禁用。
//
// 对于这三种情况`service`层的逻辑是一致的，但是UI展示应该有区别，
// 因为现在还没实现连锁处理的动画，因此暂时先都一致处理，
// 体现在 `penetrage.json`文件中三个一样的配置。
export default async (chainSolved: ygopro.StocGameMessage.MsgChainSolved) => {
  const location = matStore.chains
    .splice(chainSolved.solved_index - 1, 1)
    .at(0);
  if (location) {
    // 连锁处理时，先聚焦这张卡
    matStore.setFocus(location, true);
    await sleep(100);

    // TODO: 针对不同处理结果实现不同动画

    // 设置被连锁状态为空，接触连锁
    matStore.setChained(location, undefined);
    await sleep(100);

    // 取消聚焦
    matStore.setFocus(location, false);
  } else {
    console.warn(
      `pop from chains return null! solved_index=${chainSolved.solved_index}, len of chains in store=${matStore.chains.length}`
    );
  }
};
