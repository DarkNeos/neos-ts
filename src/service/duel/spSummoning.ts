import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";
import { fetchEsHintMeta as FIXME_fetchEsHintMeta } from "@/valtioStores";
export default (
  spSummoning: ygopro.StocGameMessage.MsgSpSummoning,
  dispatch: AppDispatch
) => {
  // dispatch(
  //   fetchEsHintMeta({
  //     originMsg: "「[?]」特殊召唤宣言时",
  //     cardID: spSummoning.code,
  //   })
  // );
  FIXME_fetchEsHintMeta({
    originMsg: "「[?]」特殊召唤宣言时",
    cardID: spSummoning.code,
  });
};
