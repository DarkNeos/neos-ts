import { proxy } from "valtio";

import { ygopro } from "@/api";
import { matStore } from "@/stores";

import type { Interactivity } from "./matStore/types";

export type PlaceInteractivity =
  | Interactivity<{
      controler: number;
      zone: ygopro.CardZone;
      sequence: number;
    }>
  | undefined;

const { MZONE, SZONE } = ygopro.CardZone;

export const placeStore = proxy({
  inner: {
    [MZONE]: {
      me: Array.from({ length: 7 }).map(() => undefined as PlaceInteractivity),
      op: Array.from({ length: 7 }).map(() => undefined as PlaceInteractivity),
    },
    [SZONE]: {
      me: Array.from({ length: 6 }).map(() => undefined as PlaceInteractivity),
      op: Array.from({ length: 6 }).map(() => undefined as PlaceInteractivity),
    },
  },
  set(
    zone: ygopro.CardZone.MZONE | ygopro.CardZone.SZONE,
    controller: number,
    sequence: number,
    placeInteractivity: PlaceInteractivity
  ) {
    placeStore.inner[zone][matStore.isMe(controller) ? "me" : "op"][sequence] =
      placeInteractivity;
  },
  clearAll() {
    (["me", "op"] as const).forEach((who) => {
      ([MZONE, SZONE] as const).forEach((where) => {
        placeStore.inner[where][who] = placeStore.inner[where][who].map(
          () => undefined
        );
      });
    });
  },
});
