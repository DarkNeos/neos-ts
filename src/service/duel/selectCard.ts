import { sendSelectMultiResponse, ygopro } from "@/api";
import MsgSelectCard = ygopro.StocGameMessage.MsgSelectCard;

import { displaySelectActionsModal } from "@/ui/Duel/Message/SelectActionsModal";

import { fetchCheckCardMeta } from "../utils";

export default async (selectCard: MsgSelectCard) => {
  const { cancelable, min, max, cards } = selectCard;

  // TODO: handle release_param

  if (!cancelable && cards.length === 1) {
    // auto send
    sendSelectMultiResponse([cards[0].response]);
    return;
  }

  const { selecteds, mustSelects, selectables } = await fetchCheckCardMeta(
    cards,
  );
  await displaySelectActionsModal({
    cancelable,
    min,
    max,
    selecteds,
    mustSelects,
    selectables,
  });
};
