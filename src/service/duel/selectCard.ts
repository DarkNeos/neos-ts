import { ygopro } from "@/api";
import {
  setCheckCardModalIsOpen,
  setCheckCardModalMinMax,
  setCheckCardModalOnSubmit,
} from "@/reducers/duel/mod";
import { fetchCheckCardMeta } from "@/reducers/duel/modal/mod";
import { AppDispatch } from "@/store";
import MsgSelectCard = ygopro.StocGameMessage.MsgSelectCard;
import {
  messageStore,
  fetchCheckCardMeta as FIXME_fetchCheckCardMeta,
} from "@/valtioStores";

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

  messageStore.checkCardModal.selectMin = min;
  messageStore.checkCardModal.selectMax = max;
  messageStore.checkCardModal.onSubmit = "sendSelectCardResponse";

  for (const card of cards) {
    const tagName = CardZoneToChinese(card.location.location);
    dispatch(
      fetchCheckCardMeta({
        tagName,
        option: {
          code: card.code,
          location: card.location,
          response: card.response,
        },
      })
    );
    // FIXME: rename
    FIXME_fetchCheckCardMeta(card.location.location, {
      code: card.code,
      location: card.location,
      response: card.response,
    });
  }

  dispatch(setCheckCardModalIsOpen(true));

  messageStore.checkCardModal.isOpen = true;
};
