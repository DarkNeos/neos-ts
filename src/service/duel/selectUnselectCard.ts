import { ygopro } from "@/api";
import { fetchCheckCardMeta, messageStore } from "@/stores";

type MsgSelectUnselectCard = ygopro.StocGameMessage.MsgSelectUnselectCard;

export default ({
  finishable,
  cancelable,
  min,
  max,
  selectable_cards: selectableCards,
  selected_cards: selectedCards,
}: MsgSelectUnselectCard) => {
  messageStore.selectCardActions.isOpen = true;
  messageStore.selectCardActions.finishAble = finishable;
  messageStore.selectCardActions.cancelAble = cancelable;
  messageStore.selectCardActions.min = min;
  messageStore.selectCardActions.max = max;

  for (const option of selectableCards) {
    fetchCheckCardMeta(option);
  }

  for (const option of selectedCards) {
    fetchCheckCardMeta(option, true);
  }
};
