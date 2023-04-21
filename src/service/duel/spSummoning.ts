import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";

export default (
  spSummoning: ygopro.StocGameMessage.MsgSpSummoning,
  dispatch: AppDispatch
) => {
  dispatch(
    fetchEsHintMeta({
      originMsg: "「[?]」特殊召唤宣言时",
      cardID: spSummoning.code,
    })
  );
};
