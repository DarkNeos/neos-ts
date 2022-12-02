import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { judgeSelf } from "./util";

export interface InitInfo {
  masterRule?: string;
  life: number;
  deckSize: number;
  extraSize: number;
}

// 更新自己的初始生命值，卡组信息
export const infoInitImpl: CaseReducer<
  DuelState,
  PayloadAction<[number, InitInfo]>
> = (state, action) => {
  const player = action.payload[0];
  const initInfo = action.payload[1];
  const selfType = state.selfType;

  if (judgeSelf(player, selfType)) {
    state.meInitInfo = initInfo;
  } else {
    state.opInitInfo = initInfo;
  }
};
