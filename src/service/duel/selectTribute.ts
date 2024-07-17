import { ygopro } from "@/api";
import { Container } from "@/container";
import { displaySelectActionsModal } from "@/ui/Duel/Message/SelectActionsModal";

import { fetchCheckCardMeta } from "../utils";
type MsgSelectTribute = ygopro.StocGameMessage.MsgSelectTribute;

export default async (
  container: Container,
  selectTribute: MsgSelectTribute,
) => {
  const { selecteds, mustSelects, selectables } = await fetchCheckCardMeta(
    container.context,
    selectTribute.selectable_cards,
  );
  // TODO: 当玩家选择卡数大于`max`时，是否也合法？
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
