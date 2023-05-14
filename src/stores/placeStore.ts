import { ygopro } from "@/api";
import { proxy } from "valtio";
import type { Interactivity } from "./matStore/types";
import { matStore } from "@/stores";

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
    placeStore.inner[MZONE].me = placeStore.inner[MZONE].me.map(
      () => undefined
    );
    placeStore.inner[MZONE].op = placeStore.inner[MZONE].op.map(
      () => undefined
    );
    placeStore.inner[SZONE].me = placeStore.inner[SZONE].me.map(
      () => undefined
    );
    placeStore.inner[SZONE].op = placeStore.inner[SZONE].op.map(
      () => undefined
    );
  },
});
