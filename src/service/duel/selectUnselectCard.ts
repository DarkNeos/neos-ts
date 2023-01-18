import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import MsgSelectUnselectCard = ygopro.StocGameMessage.MsgSelectUnselectCard;

export default (
  selectUnselectCard: MsgSelectUnselectCard,
  dispatch: AppDispatch
) => {
  console.log(selectUnselectCard);
};
