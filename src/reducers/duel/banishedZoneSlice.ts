import {
  ActionReducerMapBuilder,
  CaseReducer,
  PayloadAction,
} from "@reduxjs/toolkit";

import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { RootState } from "@/store";

import {
  createAsyncMetaThunk,
  DuelFieldState,
  DuelReducer,
  extendIdleInteractivities,
  extendMeta,
  extendState,
  Interactivity,
  removeCard,
} from "./generic";
import { DuelState } from "./mod";
import { judgeSelf } from "./util";

export interface BanishedZoneState extends DuelFieldState {}

// 初始化除外区状态
export const initBanishedZoneImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const player = action.payload;
  if (judgeSelf(player, state)) {
    state.meBanishedZone = { inner: [] };
  } else {
    state.opBanishedZone = { inner: [] };
  }
};

// 增加除外区
export const fetchBanishedZoneMeta = createAsyncMetaThunk(
  "duel/fetchBanishedZoneMeta"
);

export const banishedZoneCase = (
  builder: ActionReducerMapBuilder<DuelState>
) => {
  builder.addCase(fetchBanishedZoneMeta.pending, (state, action) => {
    // Meta结果没返回之前先更新`ID`
    const controler = action.meta.arg.controler;
    const sequence = action.meta.arg.sequence;
    const code = action.meta.arg.code;

    const newExclusion = {
      occupant: { id: code, data: {}, text: {} },
      location: {
        controler,
        location: ygopro.CardZone.REMOVED,
      },
      idleInteractivities: [],
      counters: {},
    };
    if (judgeSelf(controler, state)) {
      extendState(state.meBanishedZone, newExclusion, sequence);
    } else {
      extendState(state.opBanishedZone, newExclusion, sequence);
    }
  });
  builder.addCase(fetchBanishedZoneMeta.fulfilled, (state, action) => {
    const controler = action.payload.controler;
    const sequence = action.payload.sequence;
    const meta = action.payload.meta;

    if (judgeSelf(controler, state)) {
      extendMeta(state.meBanishedZone, meta, sequence);
    } else {
      extendMeta(state.opBanishedZone, meta, sequence);
    }
  });
};

// 删除除外区
export const removeBanishedZoneImpl: CaseReducer<
  DuelState,
  PayloadAction<{ controler: number; sequence: number }>
> = (state, action) => {
  const banishedZone = judgeSelf(action.payload.controler, state)
    ? state.meBanishedZone
    : state.opBanishedZone;
  removeCard(banishedZone, action.payload.sequence);
};

export const addBanishedZoneIdleInteractivitiesImpl: DuelReducer<{
  player: number;
  sequence: number;
  interactivity: Interactivity<number>;
}> = (state, action) => {
  const banishedZone = judgeSelf(action.payload.player, state)
    ? state.meBanishedZone
    : state.opBanishedZone;
  extendIdleInteractivities(
    banishedZone,
    action.payload.sequence,
    action.payload.interactivity
  );
};

export const selectMeBanishedZone = (state: RootState) =>
  state.duel.meBanishedZone || { inner: [] };
export const selectOpBanishedZone = (state: RootState) =>
  state.duel.opBanishedZone || { inner: [] };
