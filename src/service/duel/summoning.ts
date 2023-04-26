import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";
import { fetchEsHintMeta as FIXME_fetchEsHintMeta } from "@/valtioStores";

export default (
  summoning: ygopro.StocGameMessage.MsgSummoning,
  dispatch: AppDispatch
) => {
  // dispatch(
  //   fetchEsHintMeta({
  //     originMsg: "「[?]」通常召唤宣言时",
  //     cardID: summoning.code,
  //   })
  // );
  FIXME_fetchEsHintMeta({
    originMsg: "「[?]」通常召唤宣言时",
    cardID: summoning.code,
  });
};
