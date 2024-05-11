import { ygopro } from "@/api";
import { cardStore } from "@/stores";

export default (becomeTarget: ygopro.StocGameMessage.MsgBecomeTarget) => {
  for (const location of becomeTarget.locations) {
    const target = cardStore.at(
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
