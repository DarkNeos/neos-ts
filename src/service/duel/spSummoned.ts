import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";

export default (
  _: ygopro.StocGameMessage.MsgSpSummoned,
  dispatch: AppDispatch
) => {
  dispatch(fetchEsHintMeta({ originMsg: 1606 }));
};
