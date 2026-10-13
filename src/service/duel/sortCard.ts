import { fetchCard, ygopro } from "@/api";
import { displaySortCardModal } from "@/ui/Duel/Message";

type MsgSortCard = ygopro.StocGameMessage.MsgSortCard;

export default async (sortCard: MsgSortCard) => {
  const options = sortCard.options.map(({ code, response }) => {
    const meta = fetchCard(code!);
    return {
      meta,
      response: response!,
    };
  });
  await displaySortCardModal(options);
};
