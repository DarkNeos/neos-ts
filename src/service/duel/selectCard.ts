import { ygopro } from "@/api";
import MsgSelectCard = ygopro.StocGameMessage.MsgSelectCard;
import { fetchCheckCardMeta, messageStore } from "@/stores";

export default (selectCard: MsgSelectCard) => {
  const cancelable = selectCard.cancelable;
  const min = selectCard.min;
  const max = selectCard.max;
  const cards = selectCard.cards;

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
  messageStore.selectCardActions.isOpen = true;
};
