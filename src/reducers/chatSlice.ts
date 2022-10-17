import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

const initialState = "";

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    postChat: (state, action: PayloadAction<string>) => {
      state = action.payload;
    },
  },
});

export const { postChat } = chatSlice.actions;
export const selectChat = (state: RootState) => state.chat;
export default chatSlice.reducer;
