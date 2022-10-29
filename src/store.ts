/*
 * 全局状态存储模块
 * */
import { configureStore } from "@reduxjs/toolkit";
import joinedReducer from "./reducers/joinSlice";
import chatReducer from "./reducers/chatSlice";
import playerReducer from "./reducers/playerSlice";

export const store = configureStore({
  reducer: {
    join: joinedReducer,
    chat: chatReducer,
    player: playerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
