import { ygopro } from "@/api";
import { displaySelectActionsModal } from "@/ui/Duel/Message/SelectActionsModal";

import { fetchCheckCardMeta } from "../utils";
type MsgSelectUnselectCard = ygopro.StocGameMessage.MsgSelectUnselectCard;

export default async ({
  finishable,
  cancelable,
  min,
  max,
  selectable_cards: selectableCards,
  selected_cards: selectedCards,
}: MsgSelectUnselectCard) => {
  const {
    selecteds: selecteds1,
    mustSelects: mustSelect1,
    selectables: selectable1,
  } = await fetchCheckCardMeta(selectableCards);
  const {
    selecteds: selecteds2,
    mustSelects: mustSelect2,
    selectables: selectable2,
  } = await fetchCheckCardMeta(selectedCards, true);
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
