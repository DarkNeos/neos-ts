import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";
import {
  fetchEsHintMeta as FIXME_fetchEsHintMeta,
  matStore,
} from "@/valtioStores";
export default (
  chaining: ygopro.StocGameMessage.MsgChaining,
  dispatch: AppDispatch
) => {
  // dispatch(
  //   fetchEsHintMeta({ originMsg: "「[?]」被发动时", cardID: chaining.code })
  // );
  FIXME_fetchEsHintMeta({
    originMsg: "「[?]」被发动时",
    cardID: chaining.code,
  });
};
