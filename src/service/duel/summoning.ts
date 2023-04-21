import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";

export default (
  summoning: ygopro.StocGameMessage.MsgSummoning,
  dispatch: AppDispatch
) => {
  dispatch(
    fetchEsHintMeta({
      originMsg: "「[?]」通常召唤宣言时",
      cardID: summoning.code,
    })
  );
};
