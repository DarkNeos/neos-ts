import { fetchCard, ygopro } from "@/api";
import { displaySortCardModal } from "@/ui/Duel/Message";

type MsgSortCard = ygopro.StocGameMessage.MsgSortCard;

export default async (sortCard: MsgSortCard) => {
  const options = await Promise.all(
    sortCard.options.map(async ({ code, response }) => {
      const meta = await fetchCard(code!);
      return {
        meta,
        response: response!,
      };
    }),
  );
  await displaySortCardModal(options);
};
