import { fetchCard, ygopro } from "@/api";
import { cardStore, fetchEsHintMeta, matStore, placeStore } from "@/stores";
import { callCardFocus } from "@/ui/Duel/PlayMat/Card";

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
    const block = placeStore.of(location);
    if (block) {
      block.chainIndex.push(matStore.chains.length);
    } else {
      console.warn(`<Chaining>block from ${location} is null`);
    }

    const meta = fetchCard(chaining.code);
    // 这里不能设置`code`，因为存在一个场景：
    // 对方的`魔神仪-曼德拉护肤草`发动效果后，后端会发一次`MSG_SHUFFLE_HAND`，
    // 但传给前端的codes全是0，如果这里设置了`code`的话，
    // 在后面的`MSG_SHUFFLE_HAND`处理就会有问题。
    // target.code = meta.id;

    // 设置`Meta`信息，让对手发动效果的卡也能展示正面卡图
    if (target.code === 0) {
      target.meta = meta;
    }

    // 发动效果动画
    await callCardFocus(target.uuid);
    console.color("blue")(`${target.meta.text.name} chaining`);
    console.info(`<Chaining>chain stack length = ${matStore.chains.length}`);
  } else {
    console.warn(`<Chaining>target from ${location} is null`);
  }
};
