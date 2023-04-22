import { ygopro } from "@/api";
import {
  setCheckCardModalV3AllLevel,
  setCheckCardModalV3IsOpen,
  setCheckCardModalV3MinMax,
  setCheckCardModalV3OverFlow,
} from "@/reducers/duel/mod";
import { fetchCheckCardMetasV3 } from "@/reducers/duel/modal/checkCardModalV3Slice";
import { AppDispatch } from "@/store";
import {
  fetchCheckCardMetasV3 as FIXME_fetchCheckCardMetasV3,
  messageStore,
} from "@/valtioStores";

type MsgSelectTribute = ygopro.StocGameMessage.MsgSelectTribute;

export default (selectTribute: MsgSelectTribute, dispatch: AppDispatch) => {
  // TODO: 当玩家选择卡数大于`max`时，是否也合法？
  dispatch(setCheckCardModalV3OverFlow(true));
  messageStore.checkCardModalV3.overflow = true;
  dispatch(setCheckCardModalV3AllLevel(0));
  messageStore.checkCardModalV3.allLevel = 0;
  dispatch(
    setCheckCardModalV3MinMax({
      min: selectTribute.min,
      max: selectTribute.max,
    })
  );
  messageStore.checkCardModalV3.selectMin = selectTribute.min;
  messageStore.checkCardModalV3.selectMax = selectTribute.max;
  dispatch(
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
    })
  );
  FIXME_fetchCheckCardMetasV3({
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
  dispatch(setCheckCardModalV3IsOpen(true));
  messageStore.checkCardModalV3.isOpen = true;
};
