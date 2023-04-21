import { CaseReducer, PayloadAction } from "@reduxjs/toolkit";

import { ygopro } from "@/api";
import { RootState } from "@/store";

import { DuelState } from "./mod";
import { judgeSelf } from "./util";
import MsgUpdateHp = ygopro.StocGameMessage.MsgUpdateHp;

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

  if (judgeSelf(player, state)) {
    state.meInitInfo = initInfo;
  } else {
    state.opInitInfo = initInfo;
  }
};

export const updateHpImpl: CaseReducer<
  DuelState,
  PayloadAction<ygopro.StocGameMessage.MsgUpdateHp>
> = (state, action) => {
  const player = action.payload.player;
  const actionType = action.payload.type_;
  const value = action.payload.value;

  const info = judgeSelf(player, state) ? state.meInitInfo : state.opInitInfo;

  if (info) {
    switch (actionType) {
      case MsgUpdateHp.ActionType.DAMAGE: {
        info.life = info.life - value;
        break;
      }
      case MsgUpdateHp.ActionType.RECOVER: {
        info.life = info.life + value;
        break;
      }
      default: {
        break;
      }
    }
  }
};

export const selectMeInitInfo = (state: RootState) => state.duel.meInitInfo;
export const selectOpInitInfo = (state: RootState) => state.duel.opInitInfo;
