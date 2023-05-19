import { fetchCard, ygopro } from "@/api";
import { messageStore } from "@/stores";

type MsgSortCard = ygopro.StocGameMessage.MsgSortCard;

export default async (sortCard: MsgSortCard) => {
  await Promise.all(
    sortCard.options.map(async ({ code, response }) => {
      const meta = await fetchCard(code!);
      messageStore.sortCardModal.options.push({
        meta,
        response: response!,
      });
    })
  );
  messageStore.sortCardModal.isOpen = true;
};
