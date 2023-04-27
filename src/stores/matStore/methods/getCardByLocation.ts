import type { ygopro } from "@/api";
import { matStore } from "@/stores";

export const getCardByLocation = (location: ygopro.CardLocation) => {
  return matStore.in(location.location).of(location.controler)[
    location.sequence
  ];
};
