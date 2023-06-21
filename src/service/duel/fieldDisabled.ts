import { ygopro } from "@/api";
import { placeStore } from "@/stores";
import MsgFieldDisabled = ygopro.StocGameMessage.MsgFieldDisabled;

export default (fieldDisabled: MsgFieldDisabled) => {
  for (const action of fieldDisabled.actions) {
    switch (action.zone) {
      case ygopro.CardZone.MZONE:
      case ygopro.CardZone.SZONE:
        placeStore.set(action.zone, action.controller, action.sequence, {
          interactivity: undefined,
          disabled: true,
        });
        break;
      default:
        console.warn("<FieldDisabled>zone is not MZONE nor SZONE!");
    }
  }
};
