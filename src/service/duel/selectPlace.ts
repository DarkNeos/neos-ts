import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { AppDispatch } from "@/store";
import MsgSelectPlace = ygopro.StocGameMessage.MsgSelectPlace;
import {
  addMagicPlaceInteractivities,
  addMonsterPlaceInteractivities,
} from "@/reducers/duel/mod";

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

        break;
      }
      case ygopro.CardZone.SZONE: {
        dispatch(
          addMagicPlaceInteractivities([place.controler, place.sequence])
        );

        break;
      }
      default: {
        console.warn(`Unhandled zoneType: ${place.zone}`);
      }
    }
  }
};
