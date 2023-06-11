import { ygopro } from "@/api";
import { cardStore } from "@/stores";

export default (becomeTarget: ygopro.StocGameMessage.MsgBecomeTarget) => {
  for (const location of becomeTarget.locations) {
    const target = cardStore.at(
      location.zone,
      location.controller,
      location.sequence
    );
    if (target) {
      console.info(`${target.meta.text.name} become target`);
      // TODO: 动画
    } else {
      console.warn(`<BecomeTarget>target from ${location} is null`);
    }
  }
};
