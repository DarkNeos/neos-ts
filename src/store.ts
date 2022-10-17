import { configureStore } from "@reduxjs/toolkit";
import joinedReducer from "./reducers/joinSlice";
import chatReducer from "./reducers/chatSlice";

export const store = configureStore({
  reducer: {
    join: joinedReducer,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
