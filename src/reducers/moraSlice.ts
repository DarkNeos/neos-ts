/*
 * 猜拳页面的状态更新逻辑
 *
 * */
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface moraState {
  selectable: boolean;
}

const initialState: moraState = {
  selectable: false,
};

const moraSlice = createSlice({
  name: "mora",
  initialState,
  reducers: {
    selectAble: (state) => {
      state.selectable = true;
    },
    unSelectAble: (state) => {
      state.selectable = false;
    },
  },
});

export const { selectAble, unSelectAble } = moraSlice.actions;
export const selectMoraSelectAble = (state: RootState) => state.mora.selectable;
export default moraSlice.reducer;
