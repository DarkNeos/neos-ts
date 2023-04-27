import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/stores";
export default (chaining: ygopro.StocGameMessage.MsgChaining) => {
  fetchEsHintMeta({
    originMsg: "「[?]」被发动时",
    cardID: chaining.code,
  });
};
