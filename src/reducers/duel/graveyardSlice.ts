import {
  ActionReducerMapBuilder,
  CaseReducer,
  PayloadAction,
} from "@reduxjs/toolkit";

import { ygopro } from "@/api";
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

export interface GraveyardState extends DuelFieldState {}

// 初始化墓地状态
export const initGraveyardImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const player = action.payload;
  if (judgeSelf(player, state)) {
    state.meGraveyard = { inner: [] };
  } else {
    state.opGraveyard = { inner: [] };
  }
};

// 增加墓地
export const fetchGraveyardMeta = createAsyncMetaThunk(
  "duel/fetchGraveyardMeta"
);

export const graveyardCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchGraveyardMeta.pending, (state, action) => {
    // Meta结果没返回之前先更新`ID`
    const controler = action.meta.arg.controler;
    const sequence = action.meta.arg.sequence;
    const code = action.meta.arg.code;

    const newGraveyard = {
      occupant: { id: code, data: {}, text: {} },
      location: {
        controler,
        location: ygopro.CardZone.GRAVE,
      },
      idleInteractivities: [],
      counters: {},
    };
    if (judgeSelf(controler, state)) {
      extendState(state.meGraveyard, newGraveyard, sequence);
    } else {
      extendState(state.opGraveyard, newGraveyard, sequence);
    }
  });
  builder.addCase(fetchGraveyardMeta.fulfilled, (state, action) => {
    const controler = action.payload.controler;
    const sequence = action.payload.sequence;
    const meta = action.payload.meta;

    if (judgeSelf(controler, state)) {
      extendMeta(state.meGraveyard, meta, sequence);
    } else {
      extendMeta(state.opGraveyard, meta, sequence);
    }
  });
};

// 删除墓地
export const removeGraveyardImpl: CaseReducer<
  DuelState,
  PayloadAction<{ controler: number; sequence: number }>
> = (state, action) => {
  const graveyard = judgeSelf(action.payload.controler, state)
    ? state.meGraveyard
    : state.opGraveyard;
  removeCard(graveyard, action.payload.sequence);
};

export const addGraveyardIdleInteractivitiesImpl: DuelReducer<{
  player: number;
  sequence: number;
  interactivity: Interactivity<number>;
}> = (state, action) => {
  const graveyard = judgeSelf(action.payload.player, state)
    ? state.meGraveyard
    : state.opGraveyard;
  extendIdleInteractivities(
    graveyard,
    action.payload.sequence,
    action.payload.interactivity
  );
};

export const selectMeGraveyard = (state: RootState) =>
  state.duel.meGraveyard || { inner: [] };
export const selectOpGraveyard = (state: RootState) =>
  state.duel.opGraveyard || { inner: [] };
