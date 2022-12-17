import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { judgeSelf } from "./util";

export interface TimeLimit {
  leftTime: number;
}

// 更新计时
export const updateTimeLimitImpl: CaseReducer<
  DuelState,
  PayloadAction<[number, number]>
> = (state, action) => {
  const player = action.payload[0];
  const leftTime = action.payload[1];

  if (judgeSelf(player, state)) {
    state.meTimeLimit = { leftTime };
  } else {
    state.opTimeLimit = { leftTime };
  }
};
