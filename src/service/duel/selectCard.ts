import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import MsgSelectCard = ygopro.StocGameMessage.MsgSelectCard;

export default (selectCard: MsgSelectCard, dispatch: AppDispatch) => {
  console.log(selectCard);
  // TODO
};
