import { ygopro, fetchCard } from "@/api";
import { matStore, getCardByLocation } from "@/valtioStores";

export const fetchCardMeta = async (
  zone: ygopro.CardZone,
  controler: number,
  sequence: number,
  code: number,
  position?: ygopro.CardPosition
) => {
  await matStore.getZone(zone).setOccupant(controler, sequence, code, position);
};
