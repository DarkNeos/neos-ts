import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";
import { fetchEsHintMeta as FIXME_fetchEsHintMeta } from "@/valtioStores";

export default (
  _: ygopro.StocGameMessage.MsgFlipSummoned,
  dispatch: AppDispatch
) => {
  dispatch(fetchEsHintMeta({ originMsg: 1608 }));
  FIXME_fetchEsHintMeta({ originMsg: 1608 });
};
