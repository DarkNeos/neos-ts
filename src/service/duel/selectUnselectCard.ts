import { ygopro } from "@/api";
import { cardStore, matStore } from "@/stores";
import { displaySelectActionsModal } from "@/ui/Duel/Message/SelectActionsModal";

import { fetchCheckCardMeta } from "../utils";
import { isAllOnField } from "./util";
type MsgSelectUnselectCard = ygopro.StocGameMessage.MsgSelectUnselectCard;

export default async ({
  finishable,
  cancelable,
  min,
  max,
  selectable_cards: selectableCards,
  selected_cards: selectedCards,
}: MsgSelectUnselectCard) => {
  if (
    isAllOnField(
      selectableCards.concat(selectedCards).map((info) => info.location),
    )
  ) {
    // 所有可选卡和已选卡都是在场上或手牌
    // 通过让玩家点击场上的卡来进行选择
    for (const info of selectableCards) {
      const card = cardStore.find(info.location);
      if (card) {
        matStore.selectUnselectInfo.selectableList.push(info.location);
        card.selectInfo.selectable = true;
        card.selectInfo.response = info.response;
      }
    }
    for (const info of selectedCards) {
      const card = cardStore.find(info.location);
      if (card) {
        matStore.selectUnselectInfo.selectedList.push(info.location);
        card.selectInfo.selected = true;
        card.selectInfo.response = info.response;
      }
    }

    matStore.selectUnselectInfo.finishable = finishable;
    matStore.selectUnselectInfo.cancelable = cancelable;
  } else {
    // 有一些卡不在场上或手牌，因此无法通过点击卡片来选择
    // 这里通过让玩家点击Modal中的卡来进行选择
    const {
      selecteds: selecteds1,
      mustSelects: mustSelect1,
      selectables: selectable1,
    } = await fetchCheckCardMeta(selectableCards);
    const {
      selecteds: selecteds2,
      mustSelects: mustSelect2,
      selectables: selectable2,
    } = await fetchCheckCardMeta(selectedCards, true);
    await displaySelectActionsModal({
      finishable,
      cancelable,
      min: min,
      max: max,
      single: true,
      selecteds: [...selecteds1, ...selecteds2],
      mustSelects: [...mustSelect1, ...mustSelect2],
      selectables: [...selectable1, ...selectable2],
    });
  }
};
