import { ygopro } from "@/api";
import { fetchCheckCardMeta, messageStore } from "@/stores";
import { displaySelectActionsModal } from "@/ui/Duel/Message/NewSelectActionModal";
import { fetchCheckCardMeta as FIXME_fetchCheckCardMeta } from "../utils";
type MsgSelectSum = ygopro.StocGameMessage.MsgSelectSum;

export default async (selectSum: MsgSelectSum) => {
  messageStore.selectCardActions.overflow = selectSum.overflow != 0;
  messageStore.selectCardActions.totalLevels = selectSum.level_sum;
  messageStore.selectCardActions.min = selectSum.min;
  messageStore.selectCardActions.max = selectSum.max;

  for (const option of selectSum.must_select_cards) {
    fetchCheckCardMeta(option, false, true);
  }

  for (const option of selectSum.selectable_cards) {
    fetchCheckCardMeta(option);
  }

  messageStore.selectCardActions.isValid = true;
  messageStore.selectCardActions.isOpen = true;

  const {
    selecteds: selecteds1,
    mustSelects: mustSelect1,
    selectables: selectable1,
  } = await FIXME_fetchCheckCardMeta(selectSum.must_select_cards, false, true);
  const {
    selecteds: selecteds2,
    mustSelects: mustSelect2,
    selectables: selectable2,
  } = await FIXME_fetchCheckCardMeta(selectSum.selectable_cards);
  await displaySelectActionsModal({
    overflow: selectSum.overflow !== 0,
    totalLevels: selectSum.level_sum,
    min: selectSum.min,
    max: selectSum.max,
    selecteds: [...selecteds1, ...selecteds2],
    mustSelects: [...mustSelect1, ...mustSelect2],
    selectables: [...selectable1, ...selectable2],
  });
};
