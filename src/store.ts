import { configureStore } from "@reduxjs/toolkit";
import joinedReducer from "./reducers/joinSlice";

export const store = configureStore({
  reducer: {
    join: joinedReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
