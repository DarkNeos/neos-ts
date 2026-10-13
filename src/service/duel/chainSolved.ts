import { ygopro } from "@/api";
import { Container } from "@/container";

// 处理结束与无效状态独立保存，无效反馈由辅助消息更新，编号保留到整条连锁结束。
export default async (
  container: Container,
  chainSolved: ygopro.StocGameMessage.MsgChainSolved,
) => {
  console.info(`<ChainSolved>solved_index = ${chainSolved.solved_index}`);
  const context = container.context;
  // solved_index 从 1 开始；仅标记列表项，保持原始编号直到整个连锁结束。
  const entry = context.matStore.chainCards[chainSolved.solved_index - 1];
  if (entry) {
    entry.solved = true;
    entry.building = false;
    entry.resolving = false;
  }

  const location = context.matStore.chains
    .splice(chainSolved.solved_index - 1, 1)
    .at(0);
  if (location) {
    // 设置被连锁状态为空，解除连锁
    const block = context.placeStore.of(context, location);
    if (block) {
      block.chainIndex.pop();
    } else {
      console.warn(`<ChainSolved>block from ${location} is null`);
    }
  } else {
    console.warn(
      `pop from chains return null! solved_index=${chainSolved.solved_index},
        len of chains in store=${context.matStore.chains.length}`,
    );
  }
};
