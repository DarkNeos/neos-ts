import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { RootState } from "../../store";

export interface Hands {
  cards: number[]; // TODO: use Card struct Unitly
}

// 自己增加手牌
export const meAddHandsImpl: CaseReducer<DuelState, PayloadAction<number[]>> = (
  state,
  action
) => {
  if (state.meHands) {
    state.meHands.cards = state.meHands.cards.concat(action.payload);
  } else {
    state.meHands = { cards: action.payload };
  }
};

// 对手增加手牌
export const opAddHandsImpl: CaseReducer<DuelState, PayloadAction<number[]>> = (
  state,
  action
) => {
  if (state.opHands) {
    state.opHands.cards = state.opHands.cards.concat(action.payload);
  } else {
    state.opHands = { cards: action.payload };
  }
};

export const selectMeHands = (state: RootState) =>
  state.duel.meHands || { cards: [] };
export const selectOpHands = (state: RootState) =>
  state.duel.opHands || { cards: [] };
