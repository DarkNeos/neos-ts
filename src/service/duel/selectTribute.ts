import { ygopro } from "@/api";
import { displaySelectActionsModal } from "@/ui/Duel/Message/SelectActionsModal";

import { fetchCheckCardMeta } from "../utils";
type MsgSelectTribute = ygopro.StocGameMessage.MsgSelectTribute;

export default async (selectTribute: MsgSelectTribute) => {
  // TODO: 当玩家选择卡数大于`max`时，是否也合法？
  const { selecteds, mustSelects, selectables } = await fetchCheckCardMeta(
    selectTribute.selectable_cards
  );
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
