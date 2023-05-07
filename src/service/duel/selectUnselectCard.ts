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
  messageStore.selectCardActions.finishAble = finishable;
  messageStore.selectCardActions.cancelAble = cancelable;
  messageStore.selectCardActions.min = min;
  messageStore.selectCardActions.max = max;
  messageStore.selectCardActions.single = true;
  messageStore.selectCardActions.isValid = true;
  messageStore.selectCardActions.isOpen = true;

  for (const option of selectableCards) {
    fetchCheckCardMeta(option);
  }

  for (const option of selectedCards) {
    fetchCheckCardMeta(option, true);
  }
};
