import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";
import { matStore } from "@/valtioStores";
export default (
  chaining: ygopro.StocGameMessage.MsgChaining,
  dispatch: AppDispatch
) => {
  dispatch(
    fetchEsHintMeta({ originMsg: "「[?]」被发动时", cardID: chaining.code })
  );
  matStore.hint.fetchEsHintMeta({
    originMsg: "「[?]」被发动时",
    cardID: chaining.code,
  });
};
