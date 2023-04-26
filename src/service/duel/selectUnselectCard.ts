import { ygopro } from "@/api";
import {
  setCheckCardModalV2CancelAble,
  setCheckCardModalV2FinishAble,
  setCheckCardModalV2IsOpen,
  setCheckCardModalV2MinMax,
  setCheckCardModalV2ResponseAble,
} from "@/reducers/duel/mod";
import { fetchCheckCardMetasV2 } from "@/reducers/duel/modal/checkCardModalV2Slice";
import { AppDispatch } from "@/store";
import {
  fetchCheckCardMetasV2 as FIXME_fetchCheckCardMetasV2,
  messageStore,
} from "@/valtioStores";

type MsgSelectUnselectCard = ygopro.StocGameMessage.MsgSelectUnselectCard;

export default (
  {
    finishable,
    cancelable,
    min,
    max,
    selectable_cards: selectableCards,
    selected_cards: selectedCards,
  }: MsgSelectUnselectCard,
  dispatch: AppDispatch
) => {
  dispatch(setCheckCardModalV2IsOpen(true));
  dispatch(setCheckCardModalV2FinishAble(finishable));
  dispatch(setCheckCardModalV2CancelAble(cancelable));
  dispatch(setCheckCardModalV2MinMax({ min, max }));

  messageStore.checkCardModalV2.isOpen = true;
  messageStore.checkCardModalV2.finishAble = finishable;
  messageStore.checkCardModalV2.cancelAble = cancelable;
  messageStore.checkCardModalV2.selectMin = min;
  messageStore.checkCardModalV2.selectMax = max;

  // dispatch(
  //   fetchCheckCardMetasV2({
  //     selected: false,
  //     options: selectableCards.map((card) => {
  //       return {
  //         code: card.code,
  //         location: card.location,
  //         response: card.response,
  //       };
  //     }),
  //   })
  // );

  FIXME_fetchCheckCardMetasV2({
    selected: false,
    options: selectableCards.map((card) => {
      return {
        code: card.code,
        location: card.location,
        response: card.response,
      };
    }),
  });

  // dispatch(
  //   fetchCheckCardMetasV2({
  //     selected: true,
  //     options: selectedCards.map((card) => {
  //       return {
  //         code: card.code,
  //         location: card.location,
  //         response: card.response,
  //       };
  //     }),
  //   })
  // );

  FIXME_fetchCheckCardMetasV2({
    selected: true,
    options: selectedCards.map((card) => {
      return {
        code: card.code,
        location: card.location,
        response: card.response,
      };
    }),
  });

  dispatch(setCheckCardModalV2ResponseAble(true));

  messageStore.checkCardModalV2.responseable = true;
};
