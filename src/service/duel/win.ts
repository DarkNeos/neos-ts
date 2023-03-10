import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";

export default (win: ygopro.StocGameMessage.MsgWin, dispatch: AppDispatch) => {
  console.log(win);
};
