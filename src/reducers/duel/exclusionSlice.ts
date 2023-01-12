import { judgeSelf } from "./util";
import {
  PayloadAction,
  CaseReducer,
  ActionReducerMapBuilder,
} from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { RootState } from "../../store";
import { CardState } from "./generic";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { createAsyncMetaThunk } from "./generic";

export interface ExclusionState {
  exclusion: CardState[];
}

// 初始化除外区状态
export const initExclusionImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const player = action.payload;
  if (judgeSelf(player, state)) {
    state.meExclusion = { exclusion: [] };
  } else {
    state.opExclusion = { exclusion: [] };
  }
};

// 增加除外区
export const fetchExclusionMeta = createAsyncMetaThunk(
  "duel/fetchExclusionMeta"
);

export const exclusionCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchExclusionMeta.pending, (state, action) => {
    // Meta结果没返回之前先更新`ID`
    const controler = action.meta.arg.controler;
    const sequence = action.meta.arg.sequence;
    const code = action.meta.arg.code;

    const newExclusion = {
      occupant: { id: code, data: {}, text: {} },
      location: {
        controler,
        location: ygopro.CardZone.REMOVED,
        sequence,
      },
      idleInteractivities: [],
    };
    if (judgeSelf(controler, state)) {
      if (state.meExclusion) {
        state.meExclusion.exclusion.push(newExclusion);
      } else {
        state.meExclusion = { exclusion: [newExclusion] };
      }
    } else {
      if (state.opExclusion) {
        state.opExclusion.exclusion.push(newExclusion);
      } else {
        state.opExclusion = { exclusion: [newExclusion] };
      }
    }
  });
  builder.addCase(fetchExclusionMeta.fulfilled, (state, action) => {
    const controler = action.payload.controler;
    const sequence = action.payload.sequence;
    const meta = action.payload.meta;

    if (judgeSelf(controler, state)) {
      if (state.meExclusion) {
        for (const exclusion of state.meExclusion.exclusion) {
          if (exclusion.location.sequence == sequence) {
            exclusion.occupant = meta;
          }
        }
      }
    } else {
      if (state.opExclusion) {
        for (const exclusion of state.opExclusion.exclusion) {
          if (exclusion.location.sequence == sequence) {
            exclusion.occupant = meta;
          }
        }
      }
    }
  });
};

export const selectMeExclusion = (state: RootState) =>
  state.duel.meExclusion || { exclusion: [] };
export const selectopExclusion = (state: RootState) =>
  state.duel.opExclusion || { exclusion: [] };
