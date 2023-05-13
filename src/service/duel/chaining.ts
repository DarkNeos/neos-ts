import { ygopro } from "@/api";
import { fetchEsHintMeta, matStore } from "@/stores";
export default (chaining: ygopro.StocGameMessage.MsgChaining) => {
  fetchEsHintMeta({
    originMsg: "「[?]」被发动时",
    cardID: chaining.code,
  });

  matStore.setChaining(chaining.location, chaining.code, true);

  setTimeout(() => {
    matStore.setChaining(chaining.location, chaining.code, false);
    // TODO: set chained
  }, 500);
};
