import { ygopro } from "@/api";
import { placeStore } from "@/stores";
import MsgFieldDisabled = ygopro.StocGameMessage.MsgFieldDisabled;

export default (fieldDisabled: MsgFieldDisabled) => {
  for (const action of fieldDisabled.actions) {
    switch (action.zone) {
      case ygopro.CardZone.MZONE:
      case ygopro.CardZone.SZONE:
        const block = placeStore.of(action);
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
