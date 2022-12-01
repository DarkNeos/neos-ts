import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import { DuelState } from "./mod";

export const newPhaseImpl: CaseReducer<DuelState, PayloadAction<string>> = (
  state,
  action
) => {
  state.currentPhase = action.payload;
};

export const selectCurrentPhase = (state: RootState) => state.duel.currentPhase;
