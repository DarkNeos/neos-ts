/*
 * 对局内的状态更新逻辑
 *
 * */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitInfo } from "./initInfoSlice";

export interface DuelState {
  meInitInfo?: InitInfo; // 自己的初始状态
  opInitInfo?: InitInfo; // 对手的初始状态
}

const initialState: DuelState = {};

const duelSlice = createSlice({
  name: "duel",
  initialState,
  reducers: {
    meInfoInit: (state, action: PayloadAction<InitInfo>) => {
      state.meInitInfo = action.payload;
    },
    opInfoInit: (state, action: PayloadAction<InitInfo>) => {
      state.opInitInfo = action.payload;
    },
  },
});

export const { meInfoInit, opInfoInit } = duelSlice.actions;
export default duelSlice.reducer;
