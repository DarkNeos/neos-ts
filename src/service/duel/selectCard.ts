import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import {
  setCheckCardModalIsOpen,
  setCheckCardModalMinMax,
  setCheckCardModalOnSubmit,
} from "../../reducers/duel/mod";
import { fetchCheckCardMeta } from "../../reducers/duel/modal/mod";
import MsgSelectCard = ygopro.StocGameMessage.MsgSelectCard;
import { CardZoneToChinese } from "./util";

export default (selectCard: MsgSelectCard, dispatch: AppDispatch) => {
  const _player = selectCard.player;
  const _cancelable = selectCard.cancelable; // TODO: 处理可取消逻辑
  const min = selectCard.min;
  const max = selectCard.max;
  const cards = selectCard.cards;

  // TODO: handle release_param

  dispatch(setCheckCardModalMinMax({ min, max }));
  dispatch(setCheckCardModalOnSubmit("sendSelectCardResponse"));

  for (const card of cards) {
    const tagName = CardZoneToChinese(card.location.location);
    dispatch(
      fetchCheckCardMeta({
        controler: card.location.controler,
        tagName,
        option: {
          code: card.code,
          zone: card.location.location,
          sequence: card.location.sequence,
          response: card.response,
        },
      })
    );
  }

  dispatch(setCheckCardModalIsOpen(true));
};
