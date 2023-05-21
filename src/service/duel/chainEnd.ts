import { ygopro } from "@/api";
import { matStore } from "@/stores";

export default (_chainEnd: ygopro.StocGameMessage.MsgChainEnd) => {
  while (true) {
    const chain = matStore.chains.pop();
    if (chain === undefined) {
      break;
    }

    matStore.setChained(chain, undefined);
  }
};
