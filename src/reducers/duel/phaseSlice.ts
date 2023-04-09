import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { RootState } from "@/store";
import { DuelState } from "./mod";

export interface PhaseState {
  currentPhase: string; // 当前的阶段
  enableBp: boolean; // 允许进入战斗阶段
  enableM2: boolean; // 允许进入M2阶段
  enableEp: boolean; // 允许回合结束
}
export const newPhaseImpl: CaseReducer<DuelState, PayloadAction<string>> = (
  state,
  action
) => {
  if (state.phase) {
    state.phase.currentPhase = action.payload;
  } else {
    state.phase = {
      currentPhase: action.payload,
      enableBp: false,
      enableM2: false,
      enableEp: false,
    };
  }
};

export const setEnableBpImpl: CaseReducer<DuelState, PayloadAction<boolean>> = (
  state,
  action
) => {
  if (state.phase) {
    state.phase.enableBp = action.payload;
  }
};

export const setEnableM2Impl: CaseReducer<DuelState, PayloadAction<boolean>> = (
  state,
  action
) => {
  if (state.phase) {
    state.phase.enableM2 = action.payload;
  }
};

export const setEnableEpImpl: CaseReducer<DuelState, PayloadAction<boolean>> = (
  state,
  action
) => {
  if (state.phase) {
    state.phase.enableEp = action.payload;
  }
};

export const selectCurrentPhase = (state: RootState) =>
  state.duel.phase?.currentPhase;
export const selectEnableBp = (state: RootState) =>
  state.duel.phase?.enableBp || false;
export const selectEnableM2 = (state: RootState) =>
  state.duel.phase?.enableBp || false;
export const selectEnableEp = (state: RootState) =>
  state.duel.phase?.enableEp || false;
