/*
 * 全局状态存储模块
 * */
import { configureStore } from "@reduxjs/toolkit";
import joinedReducer from "./reducers/joinSlice";
import chatReducer from "./reducers/chatSlice";
import playerReducer from "./reducers/playerSlice";
import moraReducer from "./reducers/moraSlice";
import duelReducer from "./reducers/duel/mod";
import cardsReducer from "./reducers/cardsSlice";

export const store = configureStore({
  reducer: {
    join: joinedReducer,
    chat: chatReducer,
    player: playerReducer,
    mora: moraReducer,
    duel: duelReducer,
    cards: cardsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
