import { ygopro } from "@/api";
import { fetchCheckCardMeta, messageStore } from "@/stores";
import { displaySelectActionsModal } from "@/ui/Duel/Message/NewSelectActionModal";
import { fetchCheckCardMeta as FIXME_fetchCheckCardMeta } from "../utils";
type MsgSelectTribute = ygopro.StocGameMessage.MsgSelectTribute;

export default async (selectTribute: MsgSelectTribute) => {
  // TODO: 当玩家选择卡数大于`max`时，是否也合法？
  messageStore.selectCardActions.overflow = true;
  messageStore.selectCardActions.totalLevels = 0;
  messageStore.selectCardActions.min = selectTribute.min;
  messageStore.selectCardActions.max = selectTribute.max;

  for (const option of selectTribute.selectable_cards) {
    fetchCheckCardMeta(option);
  }

  messageStore.selectCardActions.isValid = true;
  messageStore.selectCardActions.isOpen = true;

  const { selecteds, mustSelects, selectables } =
    await FIXME_fetchCheckCardMeta(selectTribute.selectable_cards);
  await displaySelectActionsModal({
    overflow: true,
    totalLevels: 0,
    min: selectTribute.min,
    max: selectTribute.max,
    selecteds,
    mustSelects,
    selectables,
  });
};
