/*
 * 加入房间状态更新逻辑
 *
 * */
import { createSlice } from "@reduxjs/toolkit";

import { RootState } from "@/store";

export interface JoinState {
  value: boolean;
}

const initialState: JoinState = {
  value: false,
};

const joinedSlice = createSlice({
  name: "join",
  initialState,
  reducers: {
    setJoined: (state) => {
      state.value = true;
    },
    setUnJoined: (state) => {
      state.value = false;
    },
  },
});

export const { setJoined, setUnJoined } = joinedSlice.actions;
export const selectJoined = (state: RootState) => state.join.value;
export default joinedSlice.reducer;
