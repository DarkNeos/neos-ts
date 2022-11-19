import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { DuelState } from "./mod";

export interface InitInfo {
  playerType?: string;
  masterRule?: string;
  life: number;
  deckSize: number;
  extraSize: number;
}

// 更新自己的初始生命值，卡组信息
export const meInfoInitImpl: CaseReducer<DuelState, PayloadAction<InitInfo>> = (
  state,
  action
) => {
  state.meInitInfo = action.payload;
};

// 更新对手的初始生命值，卡组信息
export const opInfoInitImpl: CaseReducer<DuelState, PayloadAction<InitInfo>> = (
  state,
  action
) => {
  state.opInitInfo = action.payload;
};
