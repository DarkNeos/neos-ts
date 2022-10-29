/*
 * Chat状态更新逻辑
 *
 * */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface chatState {
  message: string;
}

const initialState: chatState = {
  message: "",
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    postChat: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
    },
  },
});

export const { postChat } = chatSlice.actions;
export const selectChat = (state: RootState) => state.chat.message;
export default chatSlice.reducer;
