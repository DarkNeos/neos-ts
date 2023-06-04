import { ygopro } from "@/api";
import { InteractType, placeStore } from "@/stores";

type MsgSelectPlace = ygopro.StocGameMessage.MsgSelectPlace;

export default (selectPlace: MsgSelectPlace) => {
  if (selectPlace.count != 1) {
    console.warn(`Unhandled case: ${selectPlace}`);
    return;
  }

  for (const place of selectPlace.places) {
    switch (place.zone) {
      case ygopro.CardZone.MZONE:
      case ygopro.CardZone.SZONE:
        placeStore.set(place.zone, place.controller, place.sequence, {
          interactType: InteractType.PLACE_SELECTABLE,
          response: {
            controller: place.controller,
            zone: place.zone,
            sequence: place.sequence,
          },
        });
        break;
    }
  }
};
