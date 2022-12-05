/*
 * 对局内的状态更新逻辑
 *
 * */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitInfo, infoInitImpl } from "./initInfoSlice";
import {
  Hands,
  handsCase,
  clearHandsInteractivityImpl,
  addHandsInteractivityImpl,
} from "./handsSlice";
import { newTurnImpl } from "./turnSlice";
import { newPhaseImpl } from "./phaseSlice";
import { RootState } from "../../store";

export interface DuelState {
  selfType?: number;
  meInitInfo?: InitInfo; // 自己的初始状态
  opInitInfo?: InitInfo; // 对手的初始状态
  meHands?: Hands; // 自己的手牌
  opHands?: Hands; // 对手的手牌
  currentPlayer?: number; // 当前的操作方
  currentPhase?: string; // 当前的阶段
}

const initialState: DuelState = {};

const duelSlice = createSlice({
  name: "duel",
  initialState,
  reducers: {
    setSelfType: (state, action: PayloadAction<number>) => {
      state.selfType = action.payload;
    },
    infoInit: infoInitImpl,
    updateTurn: newTurnImpl,
    updatePhase: newPhaseImpl,

    // 手牌相关`Reducer`
    clearHandsInteractivity: clearHandsInteractivityImpl,
    addHandsInteractivity: addHandsInteractivityImpl,
  },
  extraReducers(builder) {
    handsCase(builder);
  },
});

export const {
  setSelfType,
  infoInit,
  updateTurn,
  updatePhase,
  clearHandsInteractivity,
  addHandsInteractivity,
} = duelSlice.actions;
export const selectDuelHsStart = (state: RootState) => {
  return state.duel.meInitInfo != null;
};
export default duelSlice.reducer;
