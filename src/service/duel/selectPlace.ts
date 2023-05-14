import { ygopro } from "@/api";
import { InteractType, matStore, placeStore } from "@/stores";

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
        placeStore.set(place.zone, place.controler, place.sequence, {
          interactType: InteractType.PLACE_SELECTABLE,
          response: {
            controler: place.controler,
            zone: place.zone,
            sequence: place.sequence,
          },
        });
        break;
    }
  }

  for (const place of selectPlace.places) {
    switch (place.zone) {
      case ygopro.CardZone.MZONE: {
        matStore.monsters
          .of(place.controler)
          .setPlaceInteractivityType(
            place.sequence,
            InteractType.PLACE_SELECTABLE
          );
        break;
      }
      case ygopro.CardZone.SZONE: {
        matStore.magics
          .of(place.controler)
          .setPlaceInteractivityType(
            place.sequence,
            InteractType.PLACE_SELECTABLE
          );
        break;
      }
      default: {
        console.warn(`Unhandled zoneType: ${place.zone}`);
      }
    }
  }
};
