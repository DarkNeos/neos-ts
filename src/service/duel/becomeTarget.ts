import { ygopro } from "@/api";
import { Container } from "@/container";

export default (
  container: Container,
  becomeTarget: ygopro.StocGameMessage.MsgBecomeTarget,
) => {
  const context = container.context;
  for (const location of becomeTarget.locations) {
    const target = context.cardStore.find(location);
    if (target) {
      console.info(`${target.meta.text.name} become target`);
      target.targeted = true;
      const index = context.matStore.chainCards.length;
      const chain = context.matStore.chainCards[index - 1];
      if (chain)
        chain.targets = [...new Set([...(chain.targets ?? []), target.uuid])];
      context.historyStore.putTargeted(
        context,
        target.code,
        location,
        chain ? index : undefined,
      );
    } else {
      console.warn(`<BecomeTarget>target from ${location} is null`);
    }
  }
};
