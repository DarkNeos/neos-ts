import { ygopro } from "@/api";
import { fetchCheckCardMeta, messageStore } from "@/stores";
type MsgSelectSum = ygopro.StocGameMessage.MsgSelectSum;

export default (selectSum: MsgSelectSum) => {
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

  messageStore.selectCardActions.isOpen = true;
};
