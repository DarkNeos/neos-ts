import { ygopro } from "@/api";
import { fetchCheckCardMeta, messageStore } from "@/stores";

type MsgSelectTribute = ygopro.StocGameMessage.MsgSelectTribute;

export default (selectTribute: MsgSelectTribute) => {
  // TODO: 当玩家选择卡数大于`max`时，是否也合法？
  messageStore.selectCardActions.overflow = true;
  messageStore.selectCardActions.totalLevels = 0;
  messageStore.selectCardActions.min = selectTribute.min;
  messageStore.selectCardActions.max = selectTribute.max;

  for (const option of selectTribute.selectable_cards) {
    fetchCheckCardMeta(option);
  }

  messageStore.selectCardActions.isOpen = true;
};
