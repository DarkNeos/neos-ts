import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import { DuelState } from "./mod";

export interface ModalState {
  // 卡牌弹窗
  cardModal: {
    isOpen: boolean;
    name?: string;
    desc?: string;
    imgUrl?: string;
    interactivies: { desc: string; response: number }[];
  };
}

// 更新卡牌弹窗打开状态
export const setCardModalIsOpenImpl: CaseReducer<
  DuelState,
  PayloadAction<boolean>
> = (state, action) => {
  state.modalState.cardModal.isOpen = action.payload;
};

// 更新卡牌弹窗文本
export const setCardModalTextImpl: CaseReducer<
  DuelState,
  PayloadAction<[string?, string?]>
> = (state, action) => {
  const name = action.payload[0];
  const desc = action.payload[1];

  state.modalState.cardModal.name = name;
  state.modalState.cardModal.desc = desc;
};

// 更新卡牌弹窗图片Url
export const setCardModalImgUrlImpl: CaseReducer<
  DuelState,
  PayloadAction<string>
> = (state, action) => {
  state.modalState.cardModal.imgUrl = action.payload;
};

// 更新卡牌弹窗互动选项
export const setCardModalInteractiviesImpl: CaseReducer<
  DuelState,
  PayloadAction<{ desc: string; response: number }[]>
> = (state, action) => {
  state.modalState.cardModal.interactivies = action.payload;
};

export const selectCardModalIsOpen = (state: RootState) =>
  state.duel.modalState.cardModal.isOpen;
export const selectCardModalName = (state: RootState) =>
  state.duel.modalState.cardModal.name;
export const selectCardModalDesc = (state: RootState) =>
  state.duel.modalState.cardModal.desc;
export const selectCardModalImgUrl = (state: RootState) =>
  state.duel.modalState.cardModal.imgUrl;
export const selectCardModalInteractivies = (state: RootState) =>
  state.duel.modalState.cardModal.interactivies;
