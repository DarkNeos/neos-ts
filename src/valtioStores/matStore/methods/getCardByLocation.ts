import { matStore } from "@/valtioStores";
import type { ygopro } from "@/api";

export const getCardByLocation = (location: ygopro.CardLocation) => {
  return matStore.getZone(location.location).at(location.controler)[
    location.sequence
  ];
};
