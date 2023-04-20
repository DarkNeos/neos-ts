import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";
import { matStore } from "@/valtioStores";

export default (
  _: ygopro.StocGameMessage.MsgFlipSummoned,
  dispatch: AppDispatch
) => {
  dispatch(fetchEsHintMeta({ originMsg: 1608 }));
  matStore.hint.fetchEsHintMeta({ originMsg: 1608 });
};
