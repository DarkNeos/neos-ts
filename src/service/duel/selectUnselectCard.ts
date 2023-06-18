import { ygopro } from "@/api";
import { fetchCheckCardMeta, messageStore } from "@/stores";
import { displaySelectActionsModal } from "@/ui/Duel/Message/NewSelectActionModal";
import { fetchCheckCardMeta as FIXME_fetchCheckCardMeta } from "../utils";
type MsgSelectUnselectCard = ygopro.StocGameMessage.MsgSelectUnselectCard;

export default async ({
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

  for (const option of selectableCards) {
    await fetchCheckCardMeta(option);
  }

  for (const option of selectedCards) {
    await fetchCheckCardMeta(option, true);
  }

  messageStore.selectCardActions.isValid = true;
  messageStore.selectCardActions.isOpen = true;

  const {
    selecteds: selecteds1,
    mustSelects: mustSelect1,
    selectables: selectable1,
  } = await FIXME_fetchCheckCardMeta(selectableCards);
  const {
    selecteds: selecteds2,
    mustSelects: mustSelect2,
    selectables: selectable2,
  } = await FIXME_fetchCheckCardMeta(selectedCards, true);
  await displaySelectActionsModal({
    finishable,
    cancelable,
    min: min,
    max: max,
    single: true,
    selecteds: [...selecteds1, ...selecteds2],
    mustSelects: [...mustSelect1, ...mustSelect2],
    selectables: [...selectable1, ...selectable2],
  });
};
