import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import MsgMove = ygopro.StocGameMessage.MsgMove;
import { AppDispatch } from "../../store";

export default (move: MsgMove, dispatch: AppDispatch) => {
  console.log(move);
};
