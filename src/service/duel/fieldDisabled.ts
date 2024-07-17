import { ygopro } from "@/api";
import MsgFieldDisabled = ygopro.StocGameMessage.MsgFieldDisabled;
import { Container } from "@/container";

export default (container: Container, fieldDisabled: MsgFieldDisabled) => {
  const context = container.context;
  for (const action of fieldDisabled.actions) {
    switch (action.zone) {
      case ygopro.CardZone.MZONE:
      case ygopro.CardZone.SZONE:
        const block = context.placeStore.of(context, action);
        if (block) {
          block.disabled = action.disabled;
        } else {
          console.warn("<FieldDisabled>block is undefined");
        }
        break;
      default:
        console.warn("<FieldDisabled>zone is not MZONE nor SZONE!");
    }
  }
};
