import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";

export default (_set: ygopro.StocGameMessage.MsgSet, dispatch: AppDispatch) => {
  dispatch(fetchEsHintMeta({ originMsg: 1601 }));
};
