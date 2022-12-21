/*
 * 对局内的状态更新逻辑
 *
 * */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitInfo, infoInitImpl } from "./initInfoSlice";
import { TimeLimit, updateTimeLimitImpl } from "./timeLimit";
import {
  Hands,
  handsCase,
  clearHandsInteractivityImpl,
  addHandsInteractivityImpl,
} from "./handsSlice";
import { newTurnImpl } from "./turnSlice";
import { newPhaseImpl } from "./phaseSlice";
import { RootState } from "../../store";
import {
  ModalState,
  setCardModalIsOpenImpl,
  setCardModalTextImpl,
  setCardModalImgUrlImpl,
} from "./modal";

export interface DuelState {
  selfType?: number;
  meInitInfo?: InitInfo; // 自己的初始状态
  opInitInfo?: InitInfo; // 对手的初始状态
  meHands?: Hands; // 自己的手牌
  opHands?: Hands; // 对手的手牌
  meTimeLimit?: TimeLimit; // 自己的计时
  opTimeLimit?: TimeLimit; // 对手的计时
  currentPlayer?: number; // 当前的操作方
  currentPhase?: string; // 当前的阶段

  // UI相关
  modalState: ModalState;
}

const initialState: DuelState = {
  modalState: {
    cardModal: { isOpen: false },
  },
};

const duelSlice = createSlice({
  name: "duel",
  initialState,
  reducers: {
    setSelfType: (state, action: PayloadAction<number>) => {
      state.selfType = action.payload;
    },
    infoInit: infoInitImpl,
    updateTurn: newTurnImpl,
    updatePhase: newPhaseImpl,
    updateTimeLimit: updateTimeLimitImpl,

    // 手牌相关`Reducer`
    clearHandsInteractivity: clearHandsInteractivityImpl,
    addHandsInteractivity: addHandsInteractivityImpl,

    // UI相关`Reducer`
    setCardModalIsOpen: setCardModalIsOpenImpl,
    setCardModalText: setCardModalTextImpl,
    setCardModalImgUrl: setCardModalImgUrlImpl,
  },
  extraReducers(builder) {
    handsCase(builder);
  },
});

export const {
  setSelfType,
  infoInit,
  updateTurn,
  updatePhase,
  clearHandsInteractivity,
  addHandsInteractivity,
  updateTimeLimit,
} = duelSlice.actions;
export const selectDuelHsStart = (state: RootState) => {
  return state.duel.meInitInfo != null;
};
export default duelSlice.reducer;
