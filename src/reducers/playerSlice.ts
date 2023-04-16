/*
 * 进入房间的玩家状态更新逻辑
 *
 * */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "@/store";

export interface Player {
  name?: string;
  state?: string;
  isHost?: boolean;
  deckInfo?: deckInfo;
}

export interface deckInfo {
  mainCnt: number;
  extraCnt: number;
  sideCnt: number;
}

export interface playerState {
  player0: Player;
  player1: Player;
  observerCount: number;
  isHost: boolean;
}

const initialState: playerState = {
  player0: {},
  player1: {},
  observerCount: 0,
  isHost: false,
};

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    player0Enter: (state, action: PayloadAction<string>) => {
      state.player0.name = action.payload;
    },
    player1Enter: (state, action: PayloadAction<string>) => {
      state.player1.name = action.payload;
    },
    player0Update: (state, action: PayloadAction<string>) => {
      state.player0.state = action.payload;
    },
    player1Update: (state, action: PayloadAction<string>) => {
      state.player1.state = action.payload;
    },
    player0Leave: (state) => {
      state.player0 = {};
    },
    player1Leave: (state) => {
      state.player1 = {};
    },
    player0DeckInfo: (state, action: PayloadAction<deckInfo>) => {
      state.player0.deckInfo = action.payload;
    },
    player1DeckInfo: (state, action: PayloadAction<deckInfo>) => {
      state.player1.deckInfo = action.payload;
    },
    hostChange: (state, action: PayloadAction<number>) => {
      const i = action.payload;

      if (i === 0) {
        state.player0.isHost = true;
        state.player1.isHost = false;
      } else {
        state.player1.isHost = true;
        state.player0.isHost = false;
      }
    },
    observerIncrement: (state) => {
      state.observerCount += 1;
    },
    observerChange: (state, action: PayloadAction<number>) => {
      state.observerCount = action.payload;
    },
    updateIsHost: (state, action: PayloadAction<boolean>) => {
      state.isHost = action.payload;
    },
  },
});

export const {
  player0Enter,
  player1Enter,
  player0Update,
  player1Update,
  player0Leave,
  player1Leave,
  player0DeckInfo,
  player1DeckInfo,
  hostChange,
  observerIncrement,
  observerChange,
  updateIsHost,
} = playerSlice.actions;
export const selectPlayer0 = (state: RootState) => state.player.player0;
export const selectPlayer1 = (state: RootState) => state.player.player1;
export const selectIsHost = (state: RootState) => state.player.isHost;
export const selectObserverCount = (state: RootState) =>
  state.player.observerCount;
export default playerSlice.reducer;
