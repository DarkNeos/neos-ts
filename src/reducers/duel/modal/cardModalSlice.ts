import { CaseReducer, PayloadAction } from "@reduxjs/toolkit";

import { CardMeta } from "@/api/cards";
import { RootState } from "@/store";

import { DuelState } from "../mod";

// 更新卡牌弹窗打开状态
export const setCardModalIsOpenImpl: CaseReducer<
  DuelState,
  PayloadAction<boolean>
> = (state, action) => {
  state.modalState.cardModal.isOpen = action.payload;
};

// 更新卡牌弹窗文本
export const setCardModalMetaImpl: CaseReducer<
  DuelState,
  PayloadAction<CardMeta>
> = (state, action) => {
  state.modalState.cardModal.meta = action.payload;
};

// 更新卡牌弹窗互动选项
export const setCardModalInteractiviesImpl: CaseReducer<
  DuelState,
  PayloadAction<{ desc: string; response: number }[]>
> = (state, action) => {
  state.modalState.cardModal.interactivies = action.payload;
};

// 更新卡牌弹窗指示器
export const setCardModalCountersImpl: CaseReducer<
  DuelState,
  PayloadAction<{ [type: number]: number }>
> = (state, action) => {
  state.modalState.cardModal.counters = action.payload;
};

export const selectCardModalIsOpen = (state: RootState) =>
  state.duel.modalState.cardModal.isOpen;
export const selectCardModalMeta = (state: RootState) =>
  state.duel.modalState.cardModal.meta;
export const selectCardModalInteractivies = (state: RootState) =>
  state.duel.modalState.cardModal.interactivies;
export const selectCardModalCounters = (state: RootState) =>
  state.duel.modalState.cardModal.counters;
