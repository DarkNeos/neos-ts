import {
  PayloadAction,
  CaseReducer,
  createAsyncThunk,
  ActionReducerMapBuilder,
} from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { RootState } from "../../store";
import { CardMeta, fetchCard } from "../../api/cards";
import * as UICONFIG from "../../config/ui";

export interface Hands {
  cards: CardMeta[];
}

// 自己增加手牌
export const meAddHandsImpl: CaseReducer<DuelState, PayloadAction<number[]>> = (
  state,
  action
) => {
  const cards = action.payload.map((id) => {
    return { id, data: {}, text: {} };
  });

  if (state.meHands) {
    state.meHands.cards = state.meHands.cards.concat(cards);
  } else {
    state.meHands = { cards };
  }

  // 更新手牌的位置和旋转信息
  const groundShape = UICONFIG.GroundShape();
  const handShape = UICONFIG.HandShape();
  const gap = groundShape.width / (state.meHands.cards.length - 1);
  const left = -(groundShape.width / 2);

  state.meHands.cards.forEach((hand, idx, _) => {
    hand.position = {
      x: left + gap * idx,
      y: handShape.height / 2,
      z: -(groundShape.height / 2) - 1,
    };
    hand.rotation = UICONFIG.HandRotation();
  });
};

// 对手增加手牌
export const opAddHandsImpl: CaseReducer<DuelState, PayloadAction<number[]>> = (
  state,
  action
) => {
  const cards = action.payload.map((id) => {
    return { id, data: {}, text: {} };
  });
  if (state.opHands) {
    state.opHands.cards = state.opHands.cards.concat(cards);
  } else {
    state.opHands = { cards };
  }
};

export const fetchMeHandsMeta = createAsyncThunk(
  "duel/fetchMeHandsMeta",
  async (Ids: number[]) => {
    return await Promise.all(
      Ids.map(async (id) => {
        return await fetchCard(id);
      })
    );
  }
);

export const meHandsCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchMeHandsMeta.fulfilled, (state, action) => {
    // TODO: 合法性校验
    const cards = action.payload;
    if (state.meHands) {
      state.meHands.cards = cards;
    } else {
      state.meHands = { cards };
    }
  });
};

export const selectMeHands = (state: RootState) =>
  state.duel.meHands || { cards: [] };
export const selectOpHands = (state: RootState) =>
  state.duel.opHands || { cards: [] };
