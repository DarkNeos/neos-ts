import { judgeSelf } from "./util";
import {
  PayloadAction,
  CaseReducer,
  ActionReducerMapBuilder,
} from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { RootState } from "../../store";
import {
  InteractType,
  createAsyncMetaThunk,
  DuelFieldState,
  extendOccupant,
} from "./generic";

export interface MagicState extends DuelFieldState {}

// 初始化自己的魔法陷阱区状态
export const initMagicsImpl: CaseReducer<DuelState, PayloadAction<number>> = (
  state,
  action
) => {
  const player = action.payload;
  const magics = {
    inner: [
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
    for (const magic of magics.inner) {
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
    for (const magic of magics.inner) {
      magic.placeInteractivities = undefined;
    }
  }
};

// 增加魔法陷阱
export const fetchMagicMeta = createAsyncMetaThunk("duel/fetchMagicMeta");

export const magicCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchMagicMeta.pending, (state, action) => {
    // Meta结果没返回之前先更新`ID`
    const controler = action.meta.arg.controler;
    const sequence = action.meta.arg.sequence;
    const position = action.meta.arg.position;
    const code = action.meta.arg.code;

    const meta = { id: code, data: {}, text: {} };
    if (judgeSelf(controler, state)) {
      extendOccupant(state.meMagics, meta, sequence, position);
    } else {
      extendOccupant(state.opMagics, meta, sequence, position);
    }
  });
  builder.addCase(fetchMagicMeta.fulfilled, (state, action) => {
    const controler = action.payload.controler;
    const sequence = action.payload.sequence;
    const meta = action.payload.meta;

    if (judgeSelf(controler, state)) {
      extendOccupant(state.meMagics, meta, sequence);
    } else {
      extendOccupant(state.opMagics, meta, sequence);
    }
  });
};

export const selectMeMagics = (state: RootState) =>
  state.duel.meMagics || { inner: [] };
export const selectOpMagics = (state: RootState) =>
  state.duel.opMagics || { inner: [] };
