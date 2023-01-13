import { judgeSelf } from "./util";
import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { RootState } from "../../store";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { DuelFieldState, CardState } from "./generic";

export interface DeckState extends DuelFieldState {}

// 初始化卡组状态
export const initDeckImpl: CaseReducer<
  DuelState,
  PayloadAction<{ player: number; deskSize: number }>
> = (state, action) => {
  const player = action.payload.player;
  const deckSize = action.payload.deskSize;

  let deck: CardState[] = new Array(deckSize);
  for (let i = 0; i < deckSize; i++) {
    deck.push({
      occupant: { id: 0, data: {}, text: {} },
      location: {
        controler: player,
        location: ygopro.CardZone.DECK,
        sequence: i,
      },
      idleInteractivities: [],
    });
  }

  if (judgeSelf(player, state)) {
    state.meDeck = { inner: deck };
  } else {
    state.opDeck = { inner: deck };
  }
};

export const selectMeDeck = (state: RootState) =>
  state.duel.meDeck || { inner: [] };
export const selectOpDeck = (state: RootState) =>
  state.duel.opDeck || { inner: [] };
