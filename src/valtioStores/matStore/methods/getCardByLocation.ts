import type { ygopro } from "@/api";
import { matStore } from "@/valtioStores";

export const getCardByLocation = (location: ygopro.CardLocation) => {
  return matStore.getZone(location.location).at(location.controler)[
    location.sequence
  ];
};
