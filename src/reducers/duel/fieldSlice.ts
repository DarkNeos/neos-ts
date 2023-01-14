import { judgeSelf } from "./util";
import { DuelState } from "./mod";
import { RootState } from "../../store";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { CardState } from "./generic";

export interface FieldState {
  inner?: CardState;
}

// 初始化场地区状态
export const initFieldImpl: CaseReducer<DuelState, PayloadAction<number>> = (
  state,
  action
) => {
  const player = action.payload;
  if (judgeSelf(player, state)) {
    state.meField = {
      inner: {
        location: {
          controler: player,
          location: ygopro.CardZone.ONFIELD,
        },
        idleInteractivities: [],
      },
    };
  } else {
    state.opField = {
      inner: {
        location: {
          controler: player,
          location: ygopro.CardZone.ONFIELD,
        },
        idleInteractivities: [],
      },
    };
  }
};

export const selectMeField = (state: RootState) => state.duel.meField;
export const selectOpField = (state: RootState) => state.duel.opField;
