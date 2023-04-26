import { ygopro } from "@/api";
import { setResult } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";
import { matStore } from "@/valtioStores";

export default (win: ygopro.StocGameMessage.MsgWin, dispatch: AppDispatch) => {
  // dispatch(setResult(win.type_));
  matStore.result = win.type_;
};
