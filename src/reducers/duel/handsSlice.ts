import {
  PayloadAction,
  CaseReducer,
  createAsyncThunk,
  ActionReducerMapBuilder,
} from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { RootState } from "../../store";
import { Card, fetchCard } from "../../api/cards";
import * as UICONFIG from "../../config/ui";

export interface Hands {
  cards: Card[];
}

// 自己增加手牌
export const meAddHandsImpl: CaseReducer<DuelState, PayloadAction<number[]>> = (
  state,
  action
) => {
  const cards = action.payload.map((id) => {
    return { meta: { id, data: {}, text: {} }, transform: {} };
  });

  if (state.meHands) {
    state.meHands.cards = state.meHands.cards.concat(cards);
  } else {
    state.meHands = { cards };
  }

  setHandsTransform(state.meHands.cards);
};

// 对手增加手牌
export const opAddHandsImpl: CaseReducer<DuelState, PayloadAction<number[]>> = (
  state,
  action
) => {
  const cards = action.payload.map((id) => {
    return { meta: { id, data: {}, text: {} }, transform: {} };
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
    const cardMetas = action.payload;

    if (state.meHands) {
      for (let meta of cardMetas) {
        for (let hand of state.meHands.cards) {
          if (hand.meta.id === meta.id) {
            hand.meta = meta;
          }
        }
      }
    } else {
      state.meHands = {
        cards: cardMetas.map((meta) => {
          return { meta, transform: {} };
        }),
      };

      setHandsTransform(state.meHands.cards);
    }
  });
};

// 更新手牌的位置和旋转信息
function setHandsTransform(hands: Card[]): void {
  const groundShape = UICONFIG.GroundShape();
  const handShape = UICONFIG.HandShape();
  const gap = groundShape.width / (hands.length - 1);
  const left = -(groundShape.width / 2);

  hands.forEach((hand, idx, _) => {
    hand.transform.position = {
      x: left + gap * idx,
      y: handShape.height / 2,
      z: -(groundShape.height / 2) - 1,
    };

    const rotation = UICONFIG.HandRotation();
    hand.transform.rotation = { x: rotation.x, y: rotation.y, z: rotation.z };
  });
}

export const selectMeHands = (state: RootState) =>
  state.duel.meHands || { cards: [] };
export const selectOpHands = (state: RootState) =>
  state.duel.opHands || { cards: [] };
