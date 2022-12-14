import { judgeSelf } from "./util";
import {
  PayloadAction,
  CaseReducer,
  createAsyncThunk,
  ActionReducerMapBuilder,
} from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { RootState } from "../../store";
import { fetchCard } from "../../api/cards";
import { CardState, InteractType } from "./generic";

export interface MagicState {
  magics: CardState[];
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
        location: {
          controler: player,
          location: ygopro.CardZone.SZONE,
          sequence: 0,
        },
        idleInteractivities: [],
      },
      {
        location: {
          controler: player,
          location: ygopro.CardZone.SZONE,
          sequence: 1,
        },
        idleInteractivities: [],
      },
      {
        location: {
          controler: player,
          location: ygopro.CardZone.SZONE,
          sequence: 2,
        },
        idleInteractivities: [],
      },
      {
        location: {
          controler: player,
          location: ygopro.CardZone.SZONE,
          sequence: 3,
        },
        idleInteractivities: [],
      },
      {
        location: {
          controler: player,
          location: ygopro.CardZone.SZONE,
          sequence: 4,
        },
        idleInteractivities: [],
      },
    ],
  };

  if (judgeSelf(player, state)) {
    state.meMagics = magics;
  } else {
    state.opMagics = magics;
  }
};

export const addMagicPlaceInteractivitiesImpl: CaseReducer<
  DuelState,
  PayloadAction<[number, number]>
> = (state, action) => {
  const controler = action.payload[0];
  const sequence = action.payload[1];

  const magics = judgeSelf(controler, state) ? state.meMagics : state.opMagics;
  if (magics) {
    for (const magic of magics.magics) {
      if (magic.location.sequence == sequence) {
        magic.placeInteractivities = {
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

export const clearMagicPlaceInteractivitiesImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const player = action.payload;

  const magics = judgeSelf(player, state) ? state.meMagics : state.opMagics;

  if (magics) {
    for (const magic of magics.magics) {
      magic.placeInteractivities = undefined;
    }
  }
};

// 增加魔法陷阱
export const fetchMagicMeta = createAsyncThunk(
  "duel/fetchMagicMeta",
  async (param: {
    controler: number;
    sequence: number;
    position: ygopro.CardPosition;
    code: number;
  }) => {
    const code = param.code;

    const meta = await fetchCard(code);
    const response = {
      controler: param.controler,
      sequence: param.sequence,
      meta,
    };

    return response;
  }
);

export const magicCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchMagicMeta.pending, (state, action) => {
    // Meta结果没返回之前先更新`ID`
    const controler = action.meta.arg.controler;
    const sequence = action.meta.arg.sequence;
    const position = action.meta.arg.position;
    const code = action.meta.arg.code;

    const meta = { id: code, data: {}, text: {} };
    if (judgeSelf(controler, state)) {
      if (state.meMagics) {
        for (const magic of state.meMagics.magics) {
          if (magic.location.sequence == sequence) {
            magic.occupant = meta;
            magic.location.position = position;
          }
        }
      }
    } else {
      if (state.opMagics) {
        for (const magic of state.opMagics.magics) {
          if (magic.location.sequence == sequence) {
            magic.occupant = meta;
            magic.location.position = position;
          }
        }
      }
    }
  });
  builder.addCase(fetchMagicMeta.fulfilled, (state, action) => {
    const controler = action.payload.controler;
    const sequence = action.payload.sequence;
    const meta = action.payload.meta;

    if (judgeSelf(controler, state)) {
      if (state.meMagics) {
        for (const magic of state.meMagics.magics) {
          if (magic.location.sequence == sequence) {
            magic.occupant = meta;
          }
        }
      }
    } else {
      if (state.opMagics) {
        for (const magic of state.opMagics.magics) {
          if (magic.location.sequence == sequence) {
            magic.occupant = meta;
          }
        }
      }
    }
  });
};

export const selectMeMagics = (state: RootState) =>
  state.duel.meMagics || { magics: [] };
export const selectOpMagics = (state: RootState) =>
  state.duel.opMagics || { magics: [] };
