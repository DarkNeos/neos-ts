import { createAsyncThunk, ActionReducerMapBuilder } from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { RootState } from "../../store";
import { Card, fetchCard, CardMeta } from "../../api/cards";
import { judgeSelf } from "./util";
import * as UICONFIG from "../../config/ui";

export interface Hands {
  cards: Card[];
}

// 增加手牌
export const fetchHandsMeta = createAsyncThunk(
  "duel/fetchHandsMeta",
  async (param: [number, number[]]) => {
    const player = param[0];
    const Ids = param[1];

    const metas = await Promise.all(
      Ids.map(async (id) => {
        if (id === 0) {
          return { id, data: {}, text: {} };
        } else {
          return await fetchCard(id);
        }
      })
    );
    const response: [number, CardMeta[]] = [player, metas];

    return response;
  }
);

export const handsCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchHandsMeta.fulfilled, (state, action) => {
    const player = action.payload[0];
    const hands = action.payload[1];
    const selfType = state.selfType;

    const cards = hands.map((meta) => {
      return { meta, transform: {} };
    });
    if (judgeSelf(player, selfType)) {
      if (state.meHands) {
        state.meHands.cards = state.meHands.cards.concat(cards);
      } else {
        state.meHands = { cards };
      }
      setHandsTransform(state.meHands.cards);
    } else {
      if (state.opHands) {
        state.opHands.cards = state.opHands.cards.concat(cards);
      } else {
        state.opHands = { cards };
      }
    }
  });
};

// 更新手牌的位置和旋转信息
//
// TODO: 兼容对方手牌
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
