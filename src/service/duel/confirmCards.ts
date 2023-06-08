import { fetchCard, ygopro } from "@/api";
import { eventbus, sleep, Task } from "@/infra";
import { cardStore } from "@/stores";

export default async (confirmCards: ygopro.StocGameMessage.MsgConfirmCards) => {
  const cards = confirmCards.cards;
  console.color("pink")(`confirmCards: ${cards}`);

  for (const card of cards) {
    const target = cardStore.at(card.location, card.controller, card.sequence);

    if (target) {
      // 设置`occupant`
      const meta = await fetchCard(card.code);
      target.meta = meta;
      // 动画
      await eventbus.call(Task.Focus, target.uuid);
      // 临时措施，延迟一会，让动画逐个展示
      // 长期：需要实现动画序列，一个动画完成后才执行下一个动画
      await sleep(500);
    } else {
      console.warn(`card of ${card} is null`);
    }
  }
};
