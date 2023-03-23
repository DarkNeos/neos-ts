import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import MsgSelectSum = ygopro.StocGameMessage.MsgSelectSum;

export default (selectSum: MsgSelectSum, dispatch: AppDispatch) => {
  console.log(selectSum);
};
