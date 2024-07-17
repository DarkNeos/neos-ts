import { ygopro } from "@/api";
import { Container } from "@/container";
import { displaySelectActionsModal } from "@/ui/Duel/Message/SelectActionsModal";

import { fetchCheckCardMeta } from "../utils";
type MsgSelectSum = ygopro.StocGameMessage.MsgSelectSum;

export default async (container: Container, selectSum: MsgSelectSum) => {
  const context = container.context;
  const {
    selecteds: selecteds1,
    mustSelects: mustSelect1,
    selectables: selectable1,
  } = await fetchCheckCardMeta(
    context,
    selectSum.must_select_cards,
    false,
    true,
  );
  const {
    selecteds: selecteds2,
    mustSelects: mustSelect2,
    selectables: selectable2,
  } = await fetchCheckCardMeta(context, selectSum.selectable_cards);
  await displaySelectActionsModal({
    overflow: selectSum.overflow !== 0,
    totalLevels: selectSum.level_sum,
    min: selectSum.min < 1 ? 1 : selectSum.min, // ygopro2 implementation
    max: selectSum.max < 1 ? 99 : selectSum.max,
    selecteds: [...selecteds1, ...selecteds2],
    mustSelects: [...mustSelect1, ...mustSelect2],
    selectables: [...selectable1, ...selectable2],
  });
};
