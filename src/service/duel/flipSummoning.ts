import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";
import { fetchEsHintMeta as FIXME_fetchEsHintMeta } from "@/valtioStores";

export default (
  flipSummoning: ygopro.StocGameMessage.MsgFlipSummoning,
  dispatch: AppDispatch
) => {
  // dispatch(
  //   fetchEsHintMeta({
  //     originMsg: "「[?]」反转召唤宣言时",
  //     cardID: flipSummoning.code,
  //   })
  // );
  FIXME_fetchEsHintMeta({
    originMsg: "「[?]」反转召唤宣言时",
    cardID: flipSummoning.code,
  });
};
