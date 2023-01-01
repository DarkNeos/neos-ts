import { judgeSelf, Cemetery } from "./util";
import {
  PayloadAction,
  CaseReducer,
  createAsyncThunk,
  ActionReducerMapBuilder,
} from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { RootState } from "../../store";
import { fetchCard } from "../../api/cards";

export interface CemeteryState {
  cemetery: Cemetery[];
}

// 初始化墓地状态
export const initCemeteryImpl: CaseReducer<DuelState, PayloadAction<number>> = (
  state,
  action
) => {
  const player = action.payload;
  if (judgeSelf(player, state)) {
    state.meCemetery = { cemetery: [] };
  } else {
    state.opCemetery = { cemetery: [] };
  }
};

export const selectMeCemetery = (state: RootState) =>
  state.duel.meCemetery || { cemetery: [] };
export const selectOpCemetery = (state: RootState) =>
  state.duel.opCemetery || { cemetery: [] };
