import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { RootState } from "../../store";
import { CardMeta } from "../../api/cards";

export interface Hands {
  cards: CardMeta[];
}

// 自己增加手牌
export const meAddHandsImpl: CaseReducer<DuelState, PayloadAction<number[]>> = (
  state,
  action
) => {
  const cards = action.payload.map((id) => {
    return { id, data: {}, text: {} };
  });
  if (state.meHands) {
    state.meHands.cards = state.meHands.cards.concat(cards);
  } else {
    state.meHands = { cards };
  }
};

// 对手增加手牌
export const opAddHandsImpl: CaseReducer<DuelState, PayloadAction<number[]>> = (
  state,
  action
) => {
  const cards = action.payload.map((id) => {
    return { id, data: {}, text: {} };
  });
  if (state.opHands) {
    state.opHands.cards = state.opHands.cards.concat(cards);
  } else {
    state.opHands = { cards };
  }
};

export const selectMeHands = (state: RootState) =>
  state.duel.meHands || { cards: [] };
export const selectOpHands = (state: RootState) =>
  state.duel.opHands || { cards: [] };
