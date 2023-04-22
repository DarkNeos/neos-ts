import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";
import { fetchEsHintMeta as FIXME_fetchEsHintMeta } from "@/valtioStores";

export default (
  _swap: ygopro.StocGameMessage.MsgSwap,
  dispatch: AppDispatch
) => {
  dispatch(fetchEsHintMeta({ originMsg: 1602 }));
  FIXME_fetchEsHintMeta({ originMsg: 1602 });
};
