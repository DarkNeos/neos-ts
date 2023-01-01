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

// 增加墓地
export const fetchCemeteryMeta = createAsyncThunk(
  "duel/fetchCemeteryMeta",
  async (param: { controler: number; sequence: number; code: number }) => {
    const code = param.code;

    const meta = await fetchCard(code);
    const response = {
      controler: param.controler,
      sequence: param.sequence,
      meta,
    };

    return response;
  }
);

export const cemeteryCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchCemeteryMeta.pending, (state, action) => {
    // Meta结果没返回之前先更新`ID`
    const controler = action.meta.arg.controler;
    const sequence = action.meta.arg.sequence;
    const code = action.meta.arg.code;

    const meta = { id: code, data: {}, text: {} };
    if (judgeSelf(controler, state)) {
      if (state.meCemetery) {
        state.meCemetery.cemetery.push({ sequence, meta });
      } else {
        state.meCemetery = { cemetery: [{ sequence, meta }] };
      }
    } else {
      if (state.opCemetery) {
        state.opCemetery.cemetery.push({ sequence, meta });
      } else {
        state.opCemetery = { cemetery: [{ sequence, meta }] };
      }
    }
  });
  builder.addCase(fetchCemeteryMeta.fulfilled, (state, action) => {
    const controler = action.payload.controler;
    const sequence = action.payload.sequence;
    const meta = action.payload.meta;

    if (judgeSelf(controler, state)) {
      if (state.meCemetery) {
        for (const cemetery of state.meCemetery.cemetery) {
          if (cemetery.sequence == sequence) {
            cemetery.meta = meta;
          }
        }
      }
    } else {
      if (state.opCemetery) {
        for (const cemetery of state.opCemetery.cemetery) {
          if (cemetery.sequence == sequence) {
            cemetery.meta = meta;
          }
        }
      }
    }
  });
};

export const selectMeCemetery = (state: RootState) =>
  state.duel.meCemetery || { cemetery: [] };
export const selectOpCemetery = (state: RootState) =>
  state.duel.opCemetery || { cemetery: [] };
