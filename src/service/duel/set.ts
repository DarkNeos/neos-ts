import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";

export default (set: ygopro.StocGameMessage.MsgSet, dispatch: AppDispatch) => {
  console.log(set);
};
