import { fetchCard, ygopro } from "@/api";
import { cardStore } from "@/stores";
import { callCardFocus } from "@/ui/Duel/PlayMat/Card";

export default async (confirmCards: ygopro.StocGameMessage.MsgConfirmCards) => {
  const cards = confirmCards.cards;
  console.color("pink")(`confirmCards: ${cards}`);

  for (const card of cards) {
    const target = cardStore.at(card.location, card.controller, card.sequence);

    if (target) {
      // 设置`occupant`
      const meta = fetchCard(card.code);
      target.meta = meta;
      // 动画
      await callCardFocus(target.uuid);
      if (target.code === 0) {
        // 如果是对方或者是在观战模式下双方展示手牌，target的code会是0，
        // 这里应该清掉meta，UI上表现是回复到卡背状态
        target.meta = { id: 0, data: {}, text: {} };
      }
    } else {
      console.warn(`card of ${card} is null`);
    }
  }
};
