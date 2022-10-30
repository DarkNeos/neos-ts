/*
 * 猜拳页面的状态更新逻辑
 *
 * */
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface moraState {
  selectHandAble: boolean;
  selectTpAble: boolean;
}

const initialState: moraState = {
  selectHandAble: false,
  selectTpAble: false,
};

const moraSlice = createSlice({
  name: "mora",
  initialState,
  reducers: {
    selectHandAble: (state) => {
      state.selectHandAble = true;
    },
    unSelectHandAble: (state) => {
      state.selectHandAble = false;
    },
    selectTpAble: (state) => {
      state.selectTpAble = true;
    },
    unSelectTpAble: (state) => {
      state.selectTpAble = false;
    },
  },
});

export const {
  selectHandAble,
  unSelectHandAble,
  selectTpAble,
  unSelectTpAble,
} = moraSlice.actions;
export const selectHandSelectAble = (state: RootState) =>
  state.mora.selectHandAble;
export const selectTpSelectAble = (state: RootState) => state.mora.selectTpAble;
export default moraSlice.reducer;
