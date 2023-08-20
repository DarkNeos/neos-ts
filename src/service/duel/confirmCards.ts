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
    } else {
      console.warn(`card of ${card} is null`);
    }
  }
};
