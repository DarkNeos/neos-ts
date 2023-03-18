import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import { DuelState } from "./mod";
import { judgeSelf } from "./util";

export const newTurnImpl: CaseReducer<DuelState, PayloadAction<number>> = (
  state,
  action
) => {
  state.currentPlayer = action.payload;
};

export const selectCurrentPlayerIsMe = (state: RootState) =>
  judgeSelf(state.duel.currentPlayer!, state.duel);
