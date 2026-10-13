import { cloneDeep } from "lodash-es";
import { proxy } from "valtio";

import { ygopro } from "@/api";
import { Context } from "@/container";

import type { Interactivity } from "./matStore/types";
import { type NeosStore } from "./shared";

export type PlaceInteractivity =
  | Interactivity<{
      controller: number;
      zone: ygopro.CardZone;
      sequence: number;
    }>
  | undefined;

const { MZONE, SZONE, HAND, GRAVE, REMOVED, EXTRA } = ygopro.CardZone;

export interface BlockState {
  interactivity?: PlaceInteractivity; // 互动性
  disabled: boolean; // 是否被禁用
  chainIndex: number[] /* 当前位置上的连锁序号。
  YGOPRO和MASTER DUEL的连锁都是和位置绑定的，因此在`PlaceStore`中记录连锁状态。*/;
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
    me: genPLaces(8),
    op: genPLaces(8),
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
  [EXTRA]: {
    me: genPLaces(100),
    op: genPLaces(100),
  },
};

export class PlaceStore implements NeosStore {
  selectPlaceRequiredCount = 1;
  selectPlaceResponses: {
    controller: number;
    zone: ygopro.CardZone;
    sequence: number;
  }[] = [];

  inner: {
    [zone: number]: {
      me: BlockState[];
      op: BlockState[];
    };
  } = initialState;
  of(
    context: Context,
    location: {
      zone: ygopro.CardZone;
      controller: number;
      sequence: number;
    },
  ): BlockState | undefined {
    return this.inner[location.zone]?.[
      context.matStore.isMe(location.controller) ? "me" : "op"
    ][location.sequence];
  }
  clearAllInteractivity() {
    (["me", "op"] as const).forEach((who) => {
      ([MZONE, SZONE] as const).forEach((where) => {
        this.inner[where][who].forEach(
          (block) => (block.interactivity = undefined),
        );
      });
    });
  }
  startPlaceSelection(requiredCount: number) {
    this.selectPlaceRequiredCount = Math.max(requiredCount, 1);
    this.selectPlaceResponses = [];
  }
  pushPlaceResponse(response: {
    controller: number;
    zone: ygopro.CardZone;
    sequence: number;
  }) {
    const exists = this.selectPlaceResponses.some(
      (item) =>
        item.controller === response.controller &&
        item.zone === response.zone &&
        item.sequence === response.sequence,
    );
    if (!exists) {
      this.selectPlaceResponses.push(response);
    }
  }
  reset(): void {
    const resetObj = cloneDeep(initialState);
    Object.keys(resetObj).forEach((key) => {
      // @ts-ignore
      this.inner[key] = resetObj[key];
    });
    this.startPlaceSelection(1);
  }
}

export const placeStore = proxy(new PlaceStore());
