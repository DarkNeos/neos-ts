import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { fetchSortCardMeta } from "../../reducers/duel/modal/sortCardModalSlice";
import { AppDispatch } from "../../store";
import MsgSortCard = ygopro.StocGameMessage.MsgSortCard;

export default (sortCard: MsgSortCard, dispatch: AppDispatch) => {
  for (const option of sortCard.options) {
    dispatch(fetchSortCardMeta(option.toObject()));
  }
};
