import { ygopro } from "@/api";
import { Container } from "@/container";
import { displayFieldSelection } from "@/stores/fieldSelection";
import { displaySelectActionsModal } from "@/ui/Duel/Message/SelectActionsModal";
import { clearSelectInfo } from "@/ui/Duel/utils";

import { fetchCheckCardMeta } from "../utils";
import { isAllOnField } from "./util";
type MsgSelectUnselectCard = ygopro.StocGameMessage.MsgSelectUnselectCard;

// 逐张选择每次只提交点击的候选序号；selected_cards 是服务器累计已选。
// 两组都作为候选，点击累计已选的卡片由服务器执行取消，无需重发整个集合。
export default async (
  container: Container,
  selectUnselectCards: MsgSelectUnselectCard,
) => {
  const context = container.context;
  const cardStore = context.cardStore;
  const {
    finishable,
    cancelable,
    min,
    max,
    selectable_cards: selectableCards,
    selected_cards: selectedCards,
  } = selectUnselectCards;
  clearSelectInfo();
  if (
    selectableCards
      .concat(selectedCards)
      .every((info) => !!cardStore.find(info.location)) &&
    isAllOnField(
      selectableCards.concat(selectedCards).map((info) => info.location),
    )
  ) {
    const candidates = await fetchCheckCardMeta(context, selectableCards);
    const chosen = await fetchCheckCardMeta(context, selectedCards, true);
    if (container.conn.cancelled) return;
    await displayFieldSelection(container, {
      selectionKind: "count",
      totalLevels: 0,
      overflow: false,
      single: true,
      min,
      max,
      finishable,
      cancelable,
      mustSelects: [],
      selectables: [...candidates.selectables, ...chosen.selecteds],
    });
  } else {
    // 有一些卡不在场上或手牌，因此无法通过点击卡片来选择
    // 这里通过让玩家点击Modal中的卡来进行选择
    const {
      selecteds: selecteds1,
      mustSelects: mustSelect1,
      selectables: selectable1,
    } = await fetchCheckCardMeta(context, selectableCards);
    const {
      selecteds: selecteds2,
      mustSelects: mustSelect2,
      selectables: selectable2,
    } = await fetchCheckCardMeta(context, selectedCards, true);
    if (container.conn.cancelled) return;
    await displaySelectActionsModal({
      finishable,
      cancelable,
      min: min,
      max: max,
      single: true,
      selecteds: [],
      mustSelects: [...mustSelect1, ...mustSelect2],
      selectables: [
        ...selectable1,
        ...selectable2,
        ...selecteds1,
        ...selecteds2,
      ],
    });
  }
};
