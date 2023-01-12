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
} from "./generic";

export interface CemeteryState extends DuelFieldState {}

// 初始化墓地状态
export const initCemeteryImpl: CaseReducer<DuelState, PayloadAction<number>> = (
  state,
  action
) => {
  const player = action.payload;
  if (judgeSelf(player, state)) {
    state.meCemetery = { inner: [] };
  } else {
    state.opCemetery = { inner: [] };
  }
};

// 增加墓地
export const fetchCemeteryMeta = createAsyncMetaThunk("duel/fetchCemeteryMeta");

export const cemeteryCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchCemeteryMeta.pending, (state, action) => {
    // Meta结果没返回之前先更新`ID`
    const controler = action.meta.arg.controler;
    const sequence = action.meta.arg.sequence;
    const code = action.meta.arg.code;

    const newCemetery = {
      occupant: { id: code, data: {}, text: {} },
      location: {
        controler,
        location: ygopro.CardZone.GRAVE,
        sequence,
      },
      idleInteractivities: [],
    };
    if (judgeSelf(controler, state)) {
      extendState(state.meCemetery, newCemetery);
    } else {
      extendState(state.opCemetery, newCemetery);
    }
  });
  builder.addCase(fetchCemeteryMeta.fulfilled, (state, action) => {
    const controler = action.payload.controler;
    const sequence = action.payload.sequence;
    const meta = action.payload.meta;

    if (judgeSelf(controler, state)) {
      extendMeta(state.meCemetery, meta, sequence);
    } else {
      extendMeta(state.opCemetery, meta, sequence);
    }
  });
};

export const selectMeCemetery = (state: RootState) =>
  state.duel.meCemetery || { inner: [] };
export const selectOpCemetery = (state: RootState) =>
  state.duel.opCemetery || { inner: [] };
