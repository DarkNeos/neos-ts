import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";
import { matStore } from "@/valtioStores";

export default (
  flipSummoning: ygopro.StocGameMessage.MsgFlipSummoning,
  dispatch: AppDispatch
) => {
  dispatch(
    fetchEsHintMeta({
      originMsg: "「[?]」反转召唤宣言时",
      cardID: flipSummoning.code,
    })
  );
  matStore.hint.fetchEsHintMeta({
    originMsg: "「[?]」反转召唤宣言时",
    cardID: flipSummoning.code,
  });
};
