import { ygopro } from "@/api";
import { AppDispatch } from "@/store";
import MsgSelectPlace = ygopro.StocGameMessage.MsgSelectPlace;
import {
  addMagicPlaceInteractivities,
  addMonsterPlaceInteractivities,
} from "@/reducers/duel/mod";
import { InteractType, valtioStore } from "@/valtioStores";

const { matStore } = valtioStore;

export default (selectPlace: MsgSelectPlace, dispatch: AppDispatch) => {
  if (selectPlace.count != 1) {
    console.warn(`Unhandled case: ${selectPlace}`);

    return;
  }

  for (const place of selectPlace.places) {
    switch (place.zone) {
      case ygopro.CardZone.MZONE: {
        dispatch(
          addMonsterPlaceInteractivities([place.controler, place.sequence])
        );
        matStore.monsters
          .of(place.controler)
          .setPlaceInteractivityType(
            place.sequence,
            InteractType.PLACE_SELECTABLE
          );
        break;
      }
      case ygopro.CardZone.SZONE: {
        dispatch(
          addMagicPlaceInteractivities([place.controler, place.sequence])
        );
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
