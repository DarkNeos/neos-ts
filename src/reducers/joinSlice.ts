import { createSlice } from "@reduxjs/toolkit";

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
export default joinedSlice.reducer;
