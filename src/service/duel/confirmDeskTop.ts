import { fetchCard, ygopro } from "@/api";
import { sleep } from "@/infra";
import { matStore } from "@/stores";

export default async (
  confirmDeskTop: ygopro.StocGameMessage.MsgConfirmDeskTop
) => {
  const cards = confirmDeskTop.cards;

  for (const card of cards) {
    const target = matStore
      .in(card.location)
      .of(card.controler)
      .at(card.sequence);
    if (target) {
      // 设置`occupant`
      const meta = await fetchCard(card.code);
      target.occupant = meta;

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
