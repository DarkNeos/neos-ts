import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

const initialState = false;

const joinedSlice = createSlice({
  name: "join",
  initialState,
  reducers: {
    setJoined(state) {
      state = true;
    },
    setUnJoined(state) {
      state = false;
    },
  },
});

export const { setJoined, setUnJoined } = joinedSlice.actions;
export const selectJoined = (state: RootState) => state.join;
export default joinedSlice.reducer;
