import { ygopro } from "@/api";
import { setSortCardModalIsOpen } from "@/reducers/duel/mod";
import { fetchSortCardMeta } from "@/reducers/duel/modal/sortCardModalSlice";
import { AppDispatch } from "@/store";
import MsgSortCard = ygopro.StocGameMessage.MsgSortCard;

export default (sortCard: MsgSortCard, dispatch: AppDispatch) => {
  for (const option of sortCard.options) {
    dispatch(fetchSortCardMeta(option.toObject()));
  }
  dispatch(setSortCardModalIsOpen(true));
};
