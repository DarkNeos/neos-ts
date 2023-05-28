import { ygopro } from "@/api";
import { cardStore, matStore } from "@/stores";

export default (_chainEnd: ygopro.StocGameMessage.MsgChainEnd) => {
  while (true) {
    const chain = matStore.chains.pop();
    if (chain === undefined) {
      break;
    }

    const target = cardStore.find(chain);
    if (target) {
      target.chainIndex = undefined;
    } else {
      console.warn(`<ChainEnd>target is null`);
    }
  }
};
