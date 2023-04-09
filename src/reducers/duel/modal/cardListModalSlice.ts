import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { DuelState } from "../mod";
import { RootState } from "@/store";
import { CardMeta } from "@/api/cards";

// 更新卡牌列表弹窗打开状态
export const setCardListModalIsOpenImpl: CaseReducer<
  DuelState,
  PayloadAction<boolean>
> = (state, action) => {
  state.modalState.cardListModal.isOpen = action.payload;
};

// 更新卡牌列表数据
export const setCardListModalInfoImpl: CaseReducer<
  DuelState,
  PayloadAction<
    {
      meta?: CardMeta;
      interactivies: { desc: string; response: number }[];
    }[]
  >
> = (state, action) => {
  const list = action.payload;

  state.modalState.cardListModal.list = list;
};

export const selectCardListModalIsOpen = (state: RootState) =>
  state.duel.modalState.cardListModal.isOpen;
export const selectCardListModalInfo = (state: RootState) =>
  state.duel.modalState.cardListModal.list;
