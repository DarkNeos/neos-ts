/*
 * 卡牌数据存储
 *
 * */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { CardMeta, fetchCard } from "../api/cards";
import { RootState } from "../store";

export const fetchCardMetaById = createAsyncThunk(
  "cards/fetchByIdStatus",
  async (cardId: number) => {
    return await fetchCard(cardId);
  }
);

export interface Card {
  meta?: CardMeta;
  state: string;
}

export interface CardMetaState {
  metas: Map<number, Card>;
}

const initialState: CardMetaState = {
  metas: new Map(),
};

const cardsSlice = createSlice({
  name: "cards",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchCardMetaById.fulfilled, (state, action) => {
      const id = action.payload.id;
      const card = {
        meta: action.payload,
        state: "filled",
      };
      state.metas.set(id, card);
    }); // TODO: handle pending and rejected
  },
});

export const selectCards = (state: RootState) => state.cards.metas;
export default cardsSlice.reducer;
