import { ActionReducerMapBuilder } from "@reduxjs/toolkit";

import { ygopro } from "@/api";
import { RootState } from "@/store";

import {
  createAsyncMetaThunk,
  createAsyncRepeatedMetaThunk,
  DuelFieldState,
  DuelReducer,
  extendIdleInteractivities,
  extendMeta,
  extendState,
  Interactivity,
  removeCard,
  updateCardMeta,
} from "./generic";
import { DuelState } from "./mod";
import { judgeSelf } from "./util";

export interface ExtraDeckState extends DuelFieldState {}

// 初始化额外卡组
export const initMeExtraDeckMeta = createAsyncRepeatedMetaThunk(
  "duel/initExtraDeckMeta"
);

// 增加额外卡组
export const fetchExtraDeckMeta = createAsyncMetaThunk(
  "duel/fetchExtraDeckMeta"
);

export const extraDeckCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(initMeExtraDeckMeta.pending, (state, action) => {
    const _ = action.meta.arg.controler;
    const ids = action.meta.arg.codes;

    const cards = ids.map((id) => {
      return {
        occupant: { id, data: {}, text: {} },
        location: {
          location: ygopro.CardZone.EXTRA,
        },
        idleInteractivities: [],
        counters: {},
      };
    });
    state.meExtraDeck = { inner: cards };
  });
  builder.addCase(initMeExtraDeckMeta.fulfilled, (state, action) => {
    const _ = action.payload.controler;
    const metas = action.payload.metas;

    updateCardMeta(state.meExtraDeck, metas);
  });

  builder.addCase(fetchExtraDeckMeta.pending, (state, action) => {
    const controler = action.meta.arg.controler;
    const sequence = action.meta.arg.sequence;
    const code = action.meta.arg.code;

    const newExtraDeck = {
      occupant: { id: code, data: {}, text: {} },
      location: {
        controler,
        location: ygopro.CardZone.EXTRA,
      },
      idleInteractivities: [],
      counters: {},
    };
    const extraDeck = judgeSelf(controler, state)
      ? state.meExtraDeck
      : state.opExtraDeck;
    extendState(extraDeck, newExtraDeck, sequence);
  });
  builder.addCase(fetchExtraDeckMeta.fulfilled, (state, action) => {
    const controler = action.payload.controler;
    const sequence = action.payload.sequence;
    const meta = action.payload.meta;

    const extraDeck = judgeSelf(controler, state)
      ? state.meExtraDeck
      : state.opExtraDeck;
    extendMeta(extraDeck, meta, sequence);
  });
};

// 删除额外卡组
export const removeExtraDeckImpl: DuelReducer<{
  controler: number;
  sequence: number;
}> = (state, action) => {
  const extraDeck = judgeSelf(action.payload.controler, state)
    ? state.meExtraDeck
    : state.opExtraDeck;
  removeCard(extraDeck, action.payload.sequence);
};

export const addExtraDeckIdleInteractivitiesImpl: DuelReducer<{
  player: number;
  sequence: number;
  interactivity: Interactivity<number>;
}> = (state, action) => {
  const extraDeck = judgeSelf(action.payload.player, state)
    ? state.meExtraDeck
    : state.opExtraDeck;
  extendIdleInteractivities(
    extraDeck,
    action.payload.sequence,
    action.payload.interactivity
  );
};

export const selectMeExtraDeck = (state: RootState) =>
  state.duel.meExtraDeck || { inner: [] };
export const selectOpExtraDeck = (state: RootState) =>
  state.duel.opExtraDeck || { inner: [] };
