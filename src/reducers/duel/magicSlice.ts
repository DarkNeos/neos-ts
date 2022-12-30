import { judgeSelf, Magic, InteractType } from "./util";
import {
  PayloadAction,
  CaseReducer,
  createAsyncThunk,
  ActionReducerMapBuilder,
} from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { RootState } from "../../store";
import { CardMeta, fetchCard } from "../../api/cards";

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
    for (const magic of magics.magics) {
      magic.selectInfo = undefined;
    }
  }
};

// 增加魔法陷阱
export const fetchMagicMeta = createAsyncThunk(
  "duel/fetchMagicMeta",
  async (param: [number, number, number]) => {
    const controler = param[0];
    const sequence = param[1];
    const code = param[2];

    const meta = await fetchCard(code);
    const response: [number, number, CardMeta] = [controler, sequence, meta];

    return response;
  }
);

export const magicCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchMagicMeta.pending, (state, action) => {
    // Meta结果没返回之前先更新`ID`
    const controler = action.meta.arg[0];
    const sequence = action.meta.arg[1];
    const code = action.meta.arg[2];

    const meta = { id: code, data: {}, text: {} };
    if (judgeSelf(controler, state)) {
      if (state.meMagics) {
        for (const magic of state.meMagics.magics) {
          if (magic.sequence == sequence) {
            magic.occupant = meta;
          }
        }
      }
    } else {
      if (state.opMagics) {
        for (const magic of state.opMagics.magics) {
          if (magic.sequence == sequence) {
            magic.occupant = meta;
          }
        }
      }
    }
  });
  builder.addCase(fetchMagicMeta.fulfilled, (state, action) => {
    const controler = action.payload[0];
    const sequence = action.payload[1];
    const meta = action.payload[2];

    if (judgeSelf(controler, state)) {
      if (state.meMagics) {
        for (const magic of state.meMagics.magics) {
          if (magic.sequence == sequence) {
            magic.occupant = meta;
          }
        }
      }
    } else {
      if (state.opMagics) {
        for (const magic of state.opMagics.magics) {
          if (magic.sequence == sequence) {
            magic.occupant = meta;
          }
        }
      }
    }
  });
};

export const selectMeMagics = (state: RootState) =>
  state.duel.meMagics || { magics: [] };
