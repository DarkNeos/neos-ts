/*
 * 全局状态存储模块
 * */
import { configureStore, Unsubscribe } from "@reduxjs/toolkit";
import joinedReducer from "./reducers/joinSlice";
import chatReducer from "./reducers/chatSlice";
import playerReducer from "./reducers/playerSlice";
import moraReducer from "./reducers/moraSlice";
import duelReducer from "./reducers/duel/mod";

export const store = configureStore({
  reducer: {
    join: joinedReducer,
    chat: chatReducer,
    player: playerReducer,
    mora: moraReducer,
    duel: duelReducer,
  },
});

// Ref: https://github.com/reduxjs/redux/issues/303
export function observeStore<T>(
  select: (state: RootState) => T,
  onChange: (prev: T | null, cur: T) => void
): Unsubscribe {
  let currentState: T | null = null;

  const changeHook = () => {
    const nextState = select(store.getState());
    if (nextState !== currentState) {
      onChange(currentState, nextState);
      currentState = nextState;
    }
  };

  const unsubscribe = store.subscribe(changeHook);
  changeHook();
  return unsubscribe;
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
