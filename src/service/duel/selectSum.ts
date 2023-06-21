import { ygopro } from "@/api";
import { displaySelectActionsModal } from "@/ui/Duel/Message/SelectActionsModal";

import { fetchCheckCardMeta } from "../utils";
type MsgSelectSum = ygopro.StocGameMessage.MsgSelectSum;

export default async (selectSum: MsgSelectSum) => {
  const {
    selecteds: selecteds1,
    mustSelects: mustSelect1,
    selectables: selectable1,
  } = await fetchCheckCardMeta(selectSum.must_select_cards, false, true);
  const {
    selecteds: selecteds2,
    mustSelects: mustSelect2,
    selectables: selectable2,
  } = await fetchCheckCardMeta(selectSum.selectable_cards);
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
