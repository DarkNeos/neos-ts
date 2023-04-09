import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { setResult } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";

export default (win: ygopro.StocGameMessage.MsgWin, dispatch: AppDispatch) => {
  dispatch(setResult(win.type_));
};
