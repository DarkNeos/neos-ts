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
import {
  Interactivity,
  DuelFieldState,
  removeCard,
  createAsyncMetaThunk,
  insertCard,
  extendMeta,
} from "./generic";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";

export interface HandState extends DuelFieldState {}

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

// 清空手牌互动性
export const clearHandsIdleInteractivityImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const player = action.payload;

  const hands = judgeSelf(player, state) ? state.meHands : state.opHands;

  if (hands) {
    for (let hand of hands.inner) {
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

    hands.inner[sequence].idleInteractivities.push(interactivity);
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
  removeCard(hands, sequence);
};

export const insertHandMeta = createAsyncMetaThunk("duel/insertHandMeta");

export const handsCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchHandsMeta.pending, (state, action) => {
    // Meta结果没返回之前先更新手牌`ID`
    const player = action.meta.arg[0];
    const ids = action.meta.arg[1];

    const cards = ids.map((id, idx) => {
      return {
        occupant: { id, data: {}, text: {} },
        location: {
          controler: player,
          location: ygopro.CardZone.HAND,
          sequence: idx,
        },
        idleInteractivities: [],
      };
    });
    if (judgeSelf(player, state)) {
      if (state.meHands) {
        state.meHands.inner = state.meHands.inner.concat(cards);
      } else {
        state.meHands = { inner: cards };
      }
    } else {
      if (state.opHands) {
        state.opHands.inner = state.opHands.inner.concat(cards);
      } else {
        state.opHands = { inner: cards };
      }
    }
  });
  builder.addCase(fetchHandsMeta.fulfilled, (state, action) => {
    // `Meta`结果回来后更新手牌的`Meta`结果
    const player = action.payload[0];
    const metas = action.payload[1];

    const hands = judgeSelf(player, state) ? state.meHands : state.opHands;
    if (hands) {
      for (let hand of hands.inner) {
        for (let meta of metas) {
          if (hand.occupant?.id === meta.id) {
            hand.occupant = meta;
          }
        }
      }
    }
  });

  builder.addCase(insertHandMeta.pending, (state, action) => {
    const controler = action.meta.arg.controler;
    const sequence = action.meta.arg.sequence;
    const code = action.meta.arg.code;

    const hands = judgeSelf(controler, state) ? state.meHands : state.opHands;

    insertCard(hands, sequence, {
      occupant: { id: code, data: {}, text: {} },
      location: { controler },
      idleInteractivities: [],
    });
  });
  builder.addCase(insertHandMeta.fulfilled, (state, action) => {
    const controler = action.payload.controler;
    const sequence = action.payload.sequence;
    const meta = action.payload.meta;

    const hands = judgeSelf(controler, state) ? state.meHands : state.opHands;

    extendMeta(hands, meta, sequence);
  });
};

// 在特定位置增加手牌

export const selectMeHands = (state: RootState) =>
  state.duel.meHands || { inner: [] };
export const selectOpHands = (state: RootState) =>
  state.duel.opHands || { inner: [] };
