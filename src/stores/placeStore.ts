import { cloneDeep } from "lodash-es";
import { proxy } from "valtio";

import { ygopro } from "@/api";
import { matStore } from "@/stores";

import type { Interactivity } from "./matStore/types";
import { type NeosStore } from "./shared";

export type PlaceInteractivity =
  | Interactivity<{
      controller: number;
      zone: ygopro.CardZone;
      sequence: number;
    }>
  | undefined;

const { MZONE, SZONE, HAND, GRAVE, REMOVED } = ygopro.CardZone;

export interface BlockState {
  interactivity?: PlaceInteractivity; // 互动性
  disabled: boolean; // 是否被禁用
  chainIndex: number[]; // 当前位置上的连锁序号。YGOPRO和MASTER DUEL的连锁都是和位置绑定的，因此在`PlaceStore`中记录连锁状态。
}

const genPLaces = (n: number): BlockState[] =>
  Array.from({ length: n }).map(() => ({
    interactivity: undefined,
    disabled: false,
    chainIndex: [],
  }));

const initialState = {
  [MZONE]: {
    me: genPLaces(7),
    op: genPLaces(7),
  },
  [SZONE]: {
    me: genPLaces(6),
    op: genPLaces(6),
  },
  [HAND]: {
    me: genPLaces(100), // 给100个占位
    op: genPLaces(100),
  },
  [GRAVE]: {
    me: genPLaces(100),
    op: genPLaces(100),
  },
  [REMOVED]: {
    me: genPLaces(100),
    op: genPLaces(100),
  },
};

class PlaceStore implements NeosStore {
  inner: {
    [zone: number]: {
      me: BlockState[];
      op: BlockState[];
    };
  } = initialState;
  of(location: {
    zone: ygopro.CardZone;
    controller: number;
    sequence: number;
  }): BlockState | undefined {
    return placeStore.inner[location.zone][
      matStore.isMe(location.controller) ? "me" : "op"
    ][location.sequence];
  }
  clearAllInteractivity() {
    (["me", "op"] as const).forEach((who) => {
      ([MZONE, SZONE] as const).forEach((where) => {
        placeStore.inner[where][who].forEach(
          (block) => (block.interactivity = undefined),
        );
      });
    });
  }
  reset(): void {
    const resetObj = cloneDeep(initialState);
    Object.keys(resetObj).forEach((key) => {
      // @ts-ignore
      placeStore.inner[key] = resetObj[key];
    });
  }
}

export const placeStore = proxy(new PlaceStore());
