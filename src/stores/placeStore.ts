import { proxy } from "valtio";

import { ygopro } from "@/api";
import { matStore } from "@/stores";

import type { Interactivity } from "./matStore/types";

export type PlaceInteractivity =
  | Interactivity<{
      controller: number;
      zone: ygopro.CardZone;
      sequence: number;
    }>
  | undefined;

const { MZONE, SZONE } = ygopro.CardZone;

export interface BlockState {
  interactivity?: PlaceInteractivity; // 互动性
  disabled: boolean; // 是否被禁用
}

export const placeStore = proxy({
  inner: {
    [MZONE]: {
      me: Array.from({ length: 7 }).map(
        () =>
          ({
            interactivity: undefined,
            disabled: false,
          } as BlockState)
      ),
      op: Array.from({ length: 7 }).map(
        () =>
          ({
            interactivity: undefined,
            disabled: false,
          } as BlockState)
      ),
    },
    [SZONE]: {
      me: Array.from({ length: 6 }).map(
        () =>
          ({
            interactivity: undefined,
            disabled: false,
          } as BlockState)
      ),
      op: Array.from({ length: 6 }).map(
        () =>
          ({
            interactivity: undefined,
            disabled: false,
          } as BlockState)
      ),
    },
  },
  set(
    zone: ygopro.CardZone.MZONE | ygopro.CardZone.SZONE,
    controller: number,
    sequence: number,
    state: BlockState
  ) {
    placeStore.inner[zone][matStore.isMe(controller) ? "me" : "op"][sequence] =
      state;
  },
  clearAllInteractivity() {
    (["me", "op"] as const).forEach((who) => {
      ([MZONE, SZONE] as const).forEach((where) => {
        placeStore.inner[where][who].forEach(
          (block) => (block.interactivity = undefined)
        );
      });
    });
  },
});
