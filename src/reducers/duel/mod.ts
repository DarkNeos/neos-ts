/*
 * 对局内的状态更新逻辑
 *
 * */

import { createSlice } from "@reduxjs/toolkit";
import { InitInfo, meInfoInitImpl, opInfoInitImpl } from "./initInfoSlice";
import {
  Hands,
  meAddHandsImpl,
  opAddHandsImpl,
  meHandsCase,
} from "./handsSlice";
import { newTurnImpl } from "./turnSlice";
import { newPhaseImpl } from "./phaseSlice";
import { RootState } from "../../store";

export interface DuelState {
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
    meInfoInit: meInfoInitImpl,
    opInfoInit: opInfoInitImpl,
    meAddHands: meAddHandsImpl,
    opAddHands: opAddHandsImpl,
    updateTurn: newTurnImpl,
    updatePhase: newPhaseImpl,
  },
  extraReducers(builder) {
    meHandsCase(builder);
  },
});

export const { meInfoInit, opInfoInit, meAddHands, opAddHands, updateTurn } =
  duelSlice.actions;
export const selectDuelHsStart = (state: RootState) => {
  return state.duel.meInitInfo != null;
};
export default duelSlice.reducer;
