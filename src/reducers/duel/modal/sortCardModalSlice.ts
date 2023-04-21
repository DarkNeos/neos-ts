import {
  ActionReducerMapBuilder,
  CaseReducer,
  createAsyncThunk,
} from "@reduxjs/toolkit";

import { fetchCard } from "@/api/cards";
import { ygopro } from "@/api";
import { RootState } from "@/store";

import { DuelReducer } from "../generic";
import { DuelState } from "../mod";
type SortCard = ReturnType<
  typeof ygopro.StocGameMessage.MsgSortCard.Info.prototype.toObject
>;

export const setSortCardModalIsOpenImpl: DuelReducer<boolean> = (
  state,
  action
) => {
  state.modalState.sortCardModal.isOpen = action.payload;
};

export const resetSortCardModalImpl: CaseReducer<DuelState> = (state) => {
  state.modalState.sortCardModal.isOpen = false;
  state.modalState.sortCardModal.options = [];
};

export const fetchSortCardMeta = createAsyncThunk(
  "duel/fetchSortCardMeta",
  async (param: SortCard) => {
    const meta = await fetchCard(param.code!, true);
    return {
      meta,
      response: param.response!,
    };
  }
);

export const sortCardModalCase = (
  builder: ActionReducerMapBuilder<DuelState>
) => {
  // 这里更合理的做法是`pending`的时候先更新`options`，等`meta`数据返回后再异步更新`meta`
  builder.addCase(fetchSortCardMeta.fulfilled, (state, action) => {
    state.modalState.sortCardModal.options.push(action.payload);
  });
};

export const selectSortCardModal = (state: RootState) =>
  state.duel.modalState.sortCardModal;
