import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/stores";

export default (summoning: ygopro.StocGameMessage.MsgSummoning) => {
  fetchEsHintMeta({
    originMsg: "「[?]」通常召唤宣言时",
    cardID: summoning.code,
  });
};
