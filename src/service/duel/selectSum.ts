import { ygopro } from "@/api";
import { Container } from "@/container";

import { fetchCheckCardMeta } from "../utils";
import { selectCards } from "./cardSelection";
type MsgSelectSum = ygopro.StocGameMessage.MsgSelectSum;

export default async (container: Container, selectSum: MsgSelectSum) => {
  const context = container.context;
  const { mustSelects: mustSelect1, selectables: selectable1 } =
    await fetchCheckCardMeta(context, selectSum.must_select_cards, false, true);
  const { mustSelects: mustSelect2, selectables: selectable2 } =
    await fetchCheckCardMeta(context, selectSum.selectable_cards);
  if (container.conn.cancelled) return;
  await selectCards(container, {
    selectionKind: "sum",
    single: false,
    cancelable: false,
    overflow: selectSum.overflow !== 0,
    totalLevels: selectSum.level_sum,
    min: selectSum.min,
    max: selectSum.overflow ? selectSum.selectable_cards.length : selectSum.max,
    mustSelects: [...mustSelect1, ...mustSelect2],
    selectables: [...selectable1, ...selectable2],
  });
};
