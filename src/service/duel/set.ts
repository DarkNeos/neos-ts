import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";

export default (_set: ygopro.StocGameMessage.MsgSet, dispatch: AppDispatch) => {
  dispatch(fetchEsHintMeta({ originMsg: 1601 }));
};
