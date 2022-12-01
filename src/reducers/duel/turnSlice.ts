import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import { DuelState } from "./mod";

export const newTurnImpl: CaseReducer<DuelState, PayloadAction<number>> = (
  state,
  action
) => {
  state.currentPlayer = action.payload;
};

export const selectCurrentPlayer = (state: RootState) =>
  state.duel.currentPlayer;
