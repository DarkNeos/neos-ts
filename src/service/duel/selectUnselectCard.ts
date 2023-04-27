import { ygopro } from "@/api";
import { fetchCheckCardMetasV2, messageStore } from "@/stores";

type MsgSelectUnselectCard = ygopro.StocGameMessage.MsgSelectUnselectCard;

export default ({
  finishable,
  cancelable,
  min,
  max,
  selectable_cards: selectableCards,
  selected_cards: selectedCards,
}: MsgSelectUnselectCard) => {
  messageStore.checkCardModalV2.isOpen = true;
  messageStore.checkCardModalV2.finishAble = finishable;
  messageStore.checkCardModalV2.cancelAble = cancelable;
  messageStore.checkCardModalV2.selectMin = min;
  messageStore.checkCardModalV2.selectMax = max;

  fetchCheckCardMetasV2({
    selected: false,
    options: selectableCards.map((card) => {
      return {
        code: card.code,
        location: card.location,
        response: card.response,
      };
    }),
  });

  fetchCheckCardMetasV2({
    selected: true,
    options: selectedCards.map((card) => {
      return {
        code: card.code,
        location: card.location,
        response: card.response,
      };
    }),
  });

  messageStore.checkCardModalV2.responseable = true;
};
