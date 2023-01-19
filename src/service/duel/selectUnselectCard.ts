import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import {
  setCheckCardModalV2CancelAble,
  setCheckCardModalV2FinishAble,
  setCheckCardModalV2IsOpen,
  setCheckCardModalV2MinMax,
} from "../../reducers/duel/mod";
import { fetchCheckCardMetaV2 } from "../../reducers/duel/modal/checkCardModalV2Slice";
import { AppDispatch } from "../../store";
import MsgSelectUnselectCard = ygopro.StocGameMessage.MsgSelectUnselectCard;

export default (
  selectUnselectCard: MsgSelectUnselectCard,
  dispatch: AppDispatch
) => {
  const controler = selectUnselectCard.player;
  const finishable = selectUnselectCard.finishable;
  const cancelable = selectUnselectCard.cancelable;
  const min = selectUnselectCard.min;
  const max = selectUnselectCard.max;
  const selectableCards = selectUnselectCard.selectable_cards;
  const selectedCards = selectUnselectCard.selected_cards;

  dispatch(setCheckCardModalV2IsOpen(true));
  dispatch(setCheckCardModalV2FinishAble(finishable));
  dispatch(setCheckCardModalV2CancelAble(cancelable));
  dispatch(setCheckCardModalV2MinMax({ min, max }));

  selectableCards.forEach((card) => {
    dispatch(
      fetchCheckCardMetaV2({
        controler,
        selected: false,
        option: { code: card.code, response: card.response },
      })
    );
  });

  selectedCards.forEach((card) => {
    dispatch(
      fetchCheckCardMetaV2({
        controler,
        selected: true,
        option: { code: card.code },
      })
    );
  });
};
