import { judgeSelf, Magic, InteractType } from "./util";
import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { RootState } from "../../store";

export interface MagicState {
  magics: Magic[];
}

// 初始化自己的魔法陷阱区状态
export const initMagicsImpl: CaseReducer<DuelState, PayloadAction<number>> = (
  state,
  action
) => {
  const player = action.payload;
  const magics = {
    magics: [
      {
        sequence: 0,
      },
      {
        sequence: 1,
      },
      {
        sequence: 2,
      },
      {
        sequence: 3,
      },
      {
        sequence: 4,
      },
    ],
  };

  if (judgeSelf(player, state)) {
    state.meMagics = magics;
  } else {
    state.opMagics = magics;
  }
};

export const addMagicPlaceSelectAbleImpl: CaseReducer<
  DuelState,
  PayloadAction<[number, number]>
> = (state, action) => {
  const controler = action.payload[0];
  const sequence = action.payload[1];

  const magics = judgeSelf(controler, state) ? state.meMagics : state.opMagics;
  if (magics) {
    for (const magic of magics.magics) {
      if (magic.sequence == sequence) {
        magic.selectInfo = {
          interactType: InteractType.PLACE_SELECTABLE,
          response: {
            controler,
            zone: ygopro.CardZone.SZONE,
            sequence,
          },
        };
      }
    }
  }
};

export const clearMagicSelectInfoImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const player = action.payload;

  const magics = judgeSelf(player, state) ? state.meMagics : state.opMagics;

  if (magics) {
    magics.magics = [];
  }
};

export const selectMeMagics = (state: RootState) =>
  state.duel.meMagics || { magics: [] };
