import { ygopro } from "@/api";
import { matStore } from "@/stores";

/** 清空所有place互动性，也可以删除某一个zone的互动性。zone为空则为清除所有。 */
export const clearAllPlaceInteradtivities = (
  controller: number,
  zone?: ygopro.CardZone
) => {
  if (zone) {
    matStore.in(zone).of(controller).clearPlaceInteractivity();
  } else {
    matStore.banishedZones.of(controller).clearPlaceInteractivity();
    matStore.decks.of(controller).clearPlaceInteractivity();
    matStore.extraDecks.of(controller).clearPlaceInteractivity();
    matStore.graveyards.of(controller).clearPlaceInteractivity();
    matStore.hands.of(controller).clearPlaceInteractivity();
    matStore.magics.of(controller).clearPlaceInteractivity();
    matStore.monsters.of(controller).clearPlaceInteractivity();
  }
};
