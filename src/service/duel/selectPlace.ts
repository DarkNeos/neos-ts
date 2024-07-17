import { sendSelectPlaceResponse, ygopro } from "@/api";
import { Container } from "@/container";
import { InteractType } from "@/stores";

type MsgSelectPlace = ygopro.StocGameMessage.MsgSelectPlace;

export default async (container: Container, selectPlace: MsgSelectPlace) => {
  const conn = container.conn;
  const context = container.context;
  if (selectPlace.count !== 1) {
    console.warn(`Unhandled case: ${selectPlace}`);
    return;
  }

  if (selectPlace.places.length === 1) {
    const place = selectPlace.places[0];
    sendSelectPlaceResponse(conn, {
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
        const block = context.placeStore.of(context, place);
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
