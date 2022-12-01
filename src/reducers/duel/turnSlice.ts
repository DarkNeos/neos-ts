import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { DuelState } from "./mod";

export const newTurnImpl: CaseReducer<DuelState, PayloadAction<number>> = (
  state,
  action
) => {
  state.currentPlayer = action.payload;
};
