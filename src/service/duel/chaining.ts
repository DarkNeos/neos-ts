import { fetchCard, ygopro } from "@/api";
import { eventbus, sleep, Task } from "@/infra";
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

    const meta = await fetchCard(chaining.code);
    // 这里不能设置`code`，因为存在一个场景：
    // 对方的`魔神仪-曼德拉护肤草`发动效果后，后端会发一次`MSG_SHUFFLE_HAND`，但传给前端的codes全是0，如果这里设置了`code`的话，在后面的`MSG_SHUFFLE_HAND`处理就会有问题。
    // target.code = meta.id;

    // 设置`Meta`信息，让对手发动效果的卡也能展示正面卡图
    target.meta = meta;

    // 发动效果动画
    await eventbus.call(Task.Focus, target.uuid);
    console.color("blue")(`${target.meta.text.name} chaining`);

    // 临时办法，这里延迟500ms
    // 长期：需要实现动画序列，一个动画完成后才执行下一个动画
    await sleep(1000);
  } else {
    console.warn(`<Chaining>target from ${location} is null`);
  }
};
