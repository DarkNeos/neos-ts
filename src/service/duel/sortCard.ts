import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import MsgSortCard = ygopro.StocGameMessage.MsgSortCard;

export default (sortCard: MsgSortCard, dispatch: AppDispatch) => {
  console.log(sortCard);
};
