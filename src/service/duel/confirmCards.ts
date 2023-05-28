import { fetchCard, ygopro } from "@/api";
import { sleep } from "@/infra";
import { cardStore, matStore } from "@/stores";

export default async (confirmCards: ygopro.StocGameMessage.MsgConfirmCards) => {
  const cards = confirmCards.cards;

  for (const card of cards) {
    const target = cardStore.at(card.location, card.controler, card.sequence);

    if (target) {
      // 设置`occupant`
      const meta = await fetchCard(card.code);
      target.meta = meta;
      // 设置`position`，否则会横放
      target.position = ygopro.CardPosition.ATTACK;

      // 聚焦1s
      target.focus = true;
      await sleep(1000);
      target.focus = false;

      await sleep(200);
    } else {
      console.warn(`card of ${card} is null`);
    }
  }
};
