import { ygopro } from "@/api";
import { Container } from "@/container";

export default (
  container: Container,
  becomeTarget: ygopro.StocGameMessage.MsgBecomeTarget,
) => {
  const context = container.context;
  for (const location of becomeTarget.locations) {
    const target = context.cardStore.at(
      location.zone,
      location.controller,
      location.sequence,
    );
    if (target) {
      console.info(`${target.meta.text.name} become target`);
      target.targeted = true;
    } else {
      console.warn(`<BecomeTarget>target from ${location} is null`);
    }
  }
};
