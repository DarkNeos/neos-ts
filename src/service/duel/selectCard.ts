import { ygopro } from "@/api";
import MsgSelectCard = ygopro.StocGameMessage.MsgSelectCard;
import { fetchCheckCardMeta, messageStore } from "@/stores";

import { CardZoneToChinese } from "./util";

export default (selectCard: MsgSelectCard) => {
  const _player = selectCard.player;
  const _cancelable = selectCard.cancelable; // TODO: 处理可取消逻辑
  const min = selectCard.min;
  const max = selectCard.max;
  const cards = selectCard.cards;

  // TODO: handle release_param
  messageStore.checkCardModal.selectMin = min;
  messageStore.checkCardModal.selectMax = max;
  messageStore.checkCardModal.onSubmit = "sendSelectCardResponse";

  for (const card of cards) {
    const tagName = CardZoneToChinese(card.location.location);
    fetchCheckCardMeta(card.location.location, {
      code: card.code,
      location: card.location,
      response: card.response,
    });
  }
  messageStore.checkCardModal.isOpen = true;
};
