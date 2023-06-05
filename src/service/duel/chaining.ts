import { ygopro } from "@/api";
import { eventbus, Task } from "@/infra";
import { cardStore, fetchEsHintMeta, matStore } from "@/stores";

export default async (chaining: ygopro.StocGameMessage.MsgChaining) => {
  fetchEsHintMeta({
    originMsg: "「[?]」被发动时",
    cardID: chaining.code,
  });

  const location = chaining.location;

  // 将`location`添加到连锁栈
  matStore.chains.push(location);

  const target = cardStore.find(location);
  if (target) {
    // 设置连锁序号
    target.chainIndex = matStore.chains.length;

    // 发动效果动画
    await eventbus.call(Task.Focus, target.uuid);
    console.color("blue")(`${target.meta.text.name} chaining`);
  } else {
    console.warn(`<Chaining>target from ${location} is null`);
  }
};
