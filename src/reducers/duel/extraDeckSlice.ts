import { ActionReducerMapBuilder } from "@reduxjs/toolkit";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { RootState } from "../../store";
import { createAsyncRepeatedMetaThunk, DuelFieldState } from "./generic";
import { DuelState } from "./mod";
import { judgeSelf } from "./util";

export interface ExtraDeckState extends DuelFieldState {}

// 初始化额外卡组
export const initExtraDeckMeta = createAsyncRepeatedMetaThunk(
  "duel/initExtraDeckMeta"
);

export const extraDeckCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(initExtraDeckMeta.pending, (state, action) => {
    const player = action.meta.arg.controler;
    const ids = action.meta.arg.codes;

    const cards = ids.map((id) => {
      return {
        occupant: { id, data: {}, text: {} },
        location: {
          controler: player,
          location: ygopro.CardZone.EXTRA,
        },
        idleInteractivities: [],
      };
    });
    if (judgeSelf(player, state)) {
      state.meExtraDeck = { inner: cards };
    } else {
      state.opExtraDeck = { inner: cards };
    }
  });
};

export const selectMeExtraDeck = (state: RootState) =>
  state.duel.meExtraDeck || { inner: [] };
export const selectOpExtraDeck = (state: RootState) =>
  state.duel.opExtraDeck || { inner: [] };
