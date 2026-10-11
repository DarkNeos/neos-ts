import { fetchCard, ygopro } from "@/api";
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";
import { callCardFocus } from "@/ui/Duel/PlayMat/Card";

import { fetchEsHintMeta } from "./util";

export default async (
  container: Container,
  chaining: ygopro.StocGameMessage.MsgChaining,
) => {
  if (container.conn.cancelled) return;
  playEffect(AudioActionType.SOUND_ACTIVATE);
  const context = container.context;
  fetchEsHintMeta({
    context,
    originMsg: "「[?]」被发动时",
    cardID: chaining.code,
  });

  const location = chaining.location;
  const target = context.cardStore.find(location);

  // 将`location`添加到连锁栈
  context.matStore.chains.push(location);
  // 独立保存发动时的卡号和 UUID；卡片移动后列表仍能显示，场上编号也能跟随。
  // 此列表保留已处理项直到连锁结束，数组位置对应服务器的连锁编号。
  context.matStore.chainCards.push({
    code: chaining.code,
    controller: location.controller,
    solved: false,
    cardUuid: target?.uuid,
    targets: [],
  });

  if (target) {
    // 设置连锁序号
    const block = context.placeStore.of(context, location);
    if (block) {
      block.chainIndex.push(context.matStore.chains.length);
    } else {
      console.warn(`<Chaining>block from ${location} is null`);
    }

    const meta = fetchCard(chaining.code);
    // 发动消息公开卡片身份；之后的洗手牌消息会重新隐藏未知卡。
    if (chaining.code > 0 && target.code !== chaining.code) {
      target.code = chaining.code;
      target.meta = meta;
    }

    context.historyStore.putEffect(context, meta.id, location);

    // 发动效果动画
    await callCardFocus(target.uuid);
    console.color("blue")(`${target.meta.text.name} chaining`);
    console.info(
      `<Chaining>chain stack length = ${context.matStore.chains.length}`,
    );
  } else {
    console.warn(`<Chaining>target from ${location} is null`);
  }
};
