import {
  createAsyncThunk,
  ActionReducerMapBuilder,
  CaseReducer,
  PayloadAction,
} from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { RootState } from "../../store";
import { fetchCard, CardMeta } from "../../api/cards";
import { judgeSelf } from "./util";
import { CardState, Interactivity } from "./generic";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";

export interface HandState {
  // 注意：手牌的位置顺序是有约束的
  hands: CardState[];
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
  builder.addCase(fetchHandsMeta.pending, (state, action) => {
    // Meta结果没返回之前先更新手牌`ID`
    const player = action.meta.arg[0];
    const ids = action.meta.arg[1];

    const cards = ids.map((id, idx) => {
      return {
        occupant: { id, data: {}, text: {} },
        location: new ygopro.CardLocation({
          controler: player,
          location: ygopro.CardZone.HAND,
          sequence: idx,
        }),
        idleInteractivities: [],
      };
    });
    if (judgeSelf(player, state)) {
      if (state.meHands) {
        state.meHands.hands = state.meHands.hands.concat(cards);
      } else {
        state.meHands = { hands: cards };
      }
    } else {
      if (state.opHands) {
        state.opHands.hands = state.opHands.hands.concat(cards);
      } else {
        state.opHands = { hands: cards };
      }
    }
  });
  builder.addCase(fetchHandsMeta.fulfilled, (state, action) => {
    // `Meta`结果回来后更新手牌的`Meta`结果
    const player = action.payload[0];
    const metas = action.payload[1];

    const hands = judgeSelf(player, state) ? state.meHands : state.opHands;
    if (hands) {
      for (let hand of hands.hands) {
        for (let meta of metas) {
          if (hand.occupant?.id === meta.id) {
            hand.occupant = meta;
          }
        }
      }
    }
  });
};

// 清空手牌互动性
export const clearHandsIdleInteractivityImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const player = action.payload;

  const hands = judgeSelf(player, state) ? state.meHands : state.opHands;

  if (hands) {
    for (let hand of hands.hands) {
      hand.idleInteractivities = [];
    }
  }
};

// 添加手牌互动性
export const addHandsIdleInteractivityImpl: CaseReducer<
  DuelState,
  PayloadAction<{
    player: number;
    sequence: number;
    interactivity: Interactivity<number>;
  }>
> = (state, action) => {
  const player = action.payload.player;

  const hands = judgeSelf(player, state) ? state.meHands : state.opHands;
  if (hands) {
    const sequence = action.payload.sequence;
    const interactivity = action.payload.interactivity;

    hands.hands[sequence].idleInteractivities.push(interactivity);
  }
};

// 删除手牌
export const removeHandImpl: CaseReducer<
  DuelState,
  PayloadAction<[number, number]>
> = (state, action) => {
  const controler = action.payload[0];
  const sequence = action.payload[1];

  const hands = judgeSelf(controler, state) ? state.meHands : state.opHands;
  if (hands) {
    hands.hands = hands.hands.filter(
      (card) => card.location.sequence != sequence
    );
  }
};

export const selectMeHands = (state: RootState) =>
  state.duel.meHands || { hands: [] };
export const selectOpHands = (state: RootState) =>
  state.duel.opHands || { hands: [] };
