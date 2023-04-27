import { ygopro } from "@/api";
import { fetchCheckCardMetasV3, messageStore } from "@/stores";
type MsgSelectSum = ygopro.StocGameMessage.MsgSelectSum;

export default (selectSum: MsgSelectSum) => {
  messageStore.checkCardModalV3.overflow = selectSum.overflow != 0;
  messageStore.checkCardModalV3.allLevel = selectSum.level_sum;
  messageStore.checkCardModalV3.selectMin = selectSum.min;
  messageStore.checkCardModalV3.selectMax = selectSum.max;

  fetchCheckCardMetasV3({
    mustSelect: true,
    options: selectSum.must_select_cards,
  });

  fetchCheckCardMetasV3({
    mustSelect: false,
    options: selectSum.selectable_cards,
  });

  messageStore.checkCardModalV3.isOpen = true;
};
