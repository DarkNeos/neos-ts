import { ygopro } from "@/api";
import { useConfig } from "@/config";
import { sleep } from "@/infra";
import { fetchEsHintMeta, matStore } from "@/stores";

export default async (chaining: ygopro.StocGameMessage.MsgChaining) => {
  fetchEsHintMeta({
    originMsg: "「[?]」被发动时",
    cardID: chaining.code,
  });

  matStore.setChaining(chaining.location, chaining.code, true);

  await sleep(useConfig().ui.chainingDelay);
  matStore.setChaining(chaining.location, chaining.code, false);
  // TODO: set chained
};
