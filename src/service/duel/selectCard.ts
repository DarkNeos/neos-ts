import { ygopro } from "@/api";
import MsgSelectCard = ygopro.StocGameMessage.MsgSelectCard;
import { fetchCheckCardMeta, messageStore } from "@/stores";

import { displaySelectActionsModal } from "@/ui/Duel/Message/NewSelectActionModal";
import { fetchCheckCardMeta as FIXME_fetchCheckCardMeta } from "../utils";

export default async (selectCard: MsgSelectCard) => {
  const { cancelable, min, max, cards } = selectCard;

  // TODO: handle release_param
  messageStore.selectCardActions.min = min;
  messageStore.selectCardActions.max = max;
  messageStore.selectCardActions.cancelAble = cancelable;

  for (const card of cards) {
    fetchCheckCardMeta({
      code: card.code,
      location: card.location,
      response: card.response,
    });
  }
  messageStore.selectCardActions.isValid = true;
  messageStore.selectCardActions.isOpen = true;

  const { selecteds, mustSelects, selectables } =
    await FIXME_fetchCheckCardMeta(cards);
  await displaySelectActionsModal({
    cancelable,
    min,
    max,
    selecteds,
    mustSelects,
    selectables,
  });
};
