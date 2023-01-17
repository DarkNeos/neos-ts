import { judgeSelf } from "./util";
import {
  PayloadAction,
  CaseReducer,
  ActionReducerMapBuilder,
} from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { RootState } from "../../store";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import {
  createAsyncMetaThunk,
  DuelFieldState,
  extendState,
  extendMeta,
  removeCard,
} from "./generic";

export interface ExclusionState extends DuelFieldState {}

// 初始化除外区状态
export const initExclusionImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const player = action.payload;
  if (judgeSelf(player, state)) {
    state.meExclusion = { inner: [] };
  } else {
    state.opExclusion = { inner: [] };
  }
};

// 增加除外区
export const fetchExclusionMeta = createAsyncMetaThunk(
  "duel/fetchExclusionMeta"
);

export const exclusionCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchExclusionMeta.pending, (state, action) => {
    // Meta结果没返回之前先更新`ID`
    const controler = action.meta.arg.controler;
    const sequence = action.meta.arg.sequence;
    const code = action.meta.arg.code;

    const newExclusion = {
      occupant: { id: code, data: {}, text: {} },
      location: {
        controler,
        location: ygopro.CardZone.REMOVED,
        sequence,
      },
      idleInteractivities: [],
    };
    if (judgeSelf(controler, state)) {
      extendState(state.meExclusion, newExclusion);
    } else {
      extendState(state.opExclusion, newExclusion);
    }
  });
  builder.addCase(fetchExclusionMeta.fulfilled, (state, action) => {
    const controler = action.payload.controler;
    const sequence = action.payload.sequence;
    const meta = action.payload.meta;

    if (judgeSelf(controler, state)) {
      extendMeta(state.meExclusion, meta, sequence);
    } else {
      extendMeta(state.opExclusion, meta, sequence);
    }
  });
};

// 删除除外区
export const removeExclusionImpl: CaseReducer<
  DuelState,
  PayloadAction<{ controler: number; sequence: number }>
> = (state, action) => {
  const exclusion = judgeSelf(action.payload.controler, state)
    ? state.meExclusion
    : state.opExclusion;
  removeCard(exclusion, action.payload.sequence);
};

export const selectMeExclusion = (state: RootState) =>
  state.duel.meExclusion || { inner: [] };
export const selectopExclusion = (state: RootState) =>
  state.duel.opExclusion || { inner: [] };
