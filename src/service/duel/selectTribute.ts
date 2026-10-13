import { ygopro } from "@/api";
import { Container } from "@/container";

import { fetchCheckCardMeta } from "../utils";
import { selectCards } from "./cardSelection";
type MsgSelectTribute = ygopro.StocGameMessage.MsgSelectTribute;

export default async (
  container: Container,
  selectTribute: MsgSelectTribute,
) => {
  const { mustSelects, selectables } = await fetchCheckCardMeta(
    container.context,
    selectTribute.selectable_cards.map((card) => ({
      code: card.code,
      response: card.response,
      location: card.location,
      tributeValue: card.level,
    })),
  );
  // 可代替多个解放的卡通过 tributeValue 校验贡献值，实际张数仍受 max 限制。
  if (container.conn.cancelled) return;
  await selectCards(container, {
    selectionKind: "tribute",
    single: false,
    cancelable: selectTribute.cancelable,
    overflow: false,
    totalLevels: 0,
    min: selectTribute.min,
    max: selectTribute.max,
    mustSelects,
    selectables,
  });
};
