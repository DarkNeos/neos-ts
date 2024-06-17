import { sendSelectPlaceResponse, ygopro } from "@/api";
import { InteractType, placeStore } from "@/stores";

type MsgSelectPlace = ygopro.StocGameMessage.MsgSelectPlace;

export default (selectPlace: MsgSelectPlace) => {
  if (selectPlace.count !== 1) {
    console.warn(`Unhandled case: ${selectPlace}`);
    return;
  }

  if (selectPlace.places.length === 1) {
    const place = selectPlace.places[0];
    sendSelectPlaceResponse({
      controller: place.controller,
      zone: place.zone,
      sequence: place.sequence,
    });

    return;
  }

  for (const place of selectPlace.places) {
    switch (place.zone) {
      case ygopro.CardZone.MZONE:
      case ygopro.CardZone.SZONE:
        const block = placeStore.of(place);
        if (block) {
          block.interactivity = {
            interactType: InteractType.PLACE_SELECTABLE,
            response: {
              controller: place.controller,
              zone: place.zone,
              sequence: place.sequence,
            },
          };
        }
        break;
    }
  }
};
