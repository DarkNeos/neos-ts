/*
 * 对局内的状态更新逻辑
 *
 * */

import { createSlice } from "@reduxjs/toolkit";
import { InitInfo, meInfoInitImpl, opInfoInitImpl } from "./initInfoSlice";
import { Hands, meAddHandsImpl, opAddHandsImpl } from "./handsSlice";
import { RootState } from "../../store";

export interface DuelState {
  meInitInfo?: InitInfo; // 自己的初始状态
  opInitInfo?: InitInfo; // 对手的初始状态
  meHands?: Hands; // 自己的手牌
  opHands?: Hands; // 对手的手牌
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
  },
});

export const { meInfoInit, opInfoInit, meAddHands, opAddHands } =
  duelSlice.actions;
export const selectDuelHsStart = (state: RootState) => {
  return state.duel.meInitInfo != null;
};
export default duelSlice.reducer;
