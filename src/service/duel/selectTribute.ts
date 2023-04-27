import { ygopro } from "@/api";
import { fetchCheckCardMetasV3, messageStore } from "@/stores";

type MsgSelectTribute = ygopro.StocGameMessage.MsgSelectTribute;

export default (selectTribute: MsgSelectTribute) => {
  // TODO: 当玩家选择卡数大于`max`时，是否也合法？
  messageStore.checkCardModalV3.overflow = true;
  messageStore.checkCardModalV3.allLevel = 0;
  messageStore.checkCardModalV3.selectMin = selectTribute.min;
  messageStore.checkCardModalV3.selectMax = selectTribute.max;

  fetchCheckCardMetasV3({
    mustSelect: false,
    options: selectTribute.selectable_cards.map((card) => {
      return {
        code: card.code,
        location: card.location,
        level1: card.level,
        level2: card.level,
        response: card.response,
      };
    }),
  });

  messageStore.checkCardModalV3.isOpen = true;
};
