import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/stores";
export default (spSummoning: ygopro.StocGameMessage.MsgSpSummoning) => {
  fetchEsHintMeta({
    originMsg: "「[?]」特殊召唤宣言时",
    cardID: spSummoning.code,
  });
};
