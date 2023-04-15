import {
  ActionReducerMapBuilder,
  CaseReducer,
  createAsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit";

import { fetchCard, getCardStr } from "@/api/cards";
import { RootState } from "@/store";

import { DuelState } from "../mod";

export const setOptionModalIsOpenImpl: CaseReducer<
  DuelState,
  PayloadAction<boolean>
> = (state, action) => {
  state.modalState.optionModal.isOpen = action.payload;
};

export const resetOptionModalImpl: CaseReducer<DuelState> = (state) => {
  state.modalState.optionModal.options = [];
};

// 增加选项
export const fetchOptionMeta = createAsyncThunk(
  "duel/fetchOptionMeta",
  async (param: { code: number; response: number }) => {
    const meta = await fetchCard(param.code >> 4, true);
    const msg = getCardStr(meta, param.code & 0xf) || "[?]";

    const response = { msg, response: param.response };

    return response;
  }
);

export const optionModalCase = (
  builder: ActionReducerMapBuilder<DuelState>
) => {
  builder.addCase(fetchOptionMeta.fulfilled, (state, action) => {
    state.modalState.optionModal.options.push(action.payload);
  });
};

export const selectOptionModalIsOpen = (state: RootState) =>
  state.duel.modalState.optionModal.isOpen;
export const selectOptionModalOptions = (state: RootState) =>
  state.duel.modalState.optionModal.options;
