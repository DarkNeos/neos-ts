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
  createAsyncMetaThunk,
  DuelFieldState,
  extendOccupant,
  extendPlaceInteractivity,
  clearPlaceInteractivities,
  removeOccupant,
  Interactivity,
  extendIdleInteractivities,
  clearIdleInteractivities,
  setPosition,
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
        counters: {},
      },
      {
        location: {
          controler: player,
          location: ygopro.CardZone.SZONE,
          sequence: 1,
        },
        idleInteractivities: [],
        counters: {},
      },
      {
        location: {
          controler: player,
          location: ygopro.CardZone.SZONE,
          sequence: 2,
        },
        idleInteractivities: [],
        counters: {},
      },
      {
        location: {
          controler: player,
          location: ygopro.CardZone.SZONE,
          sequence: 3,
        },
        idleInteractivities: [],
        counters: {},
      },
      {
        location: {
          controler: player,
          location: ygopro.CardZone.SZONE,
          sequence: 4,
        },
        idleInteractivities: [],
        counters: {},
      },
      {
        // 场地区
        location: {
          controler: player,
          location: ygopro.CardZone.SZONE,
          sequence: 5,
        },
        idleInteractivities: [],
        counters: {},
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
  extendPlaceInteractivity(magics, controler, sequence, ygopro.CardZone.SZONE);
};

export const clearMagicPlaceInteractivitiesImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const player = action.payload;

  const magics = judgeSelf(player, state) ? state.meMagics : state.opMagics;
  clearPlaceInteractivities(magics);
};

export const addMagicIdleInteractivitiesImpl: CaseReducer<
  DuelState,
  PayloadAction<{
    player: number;
    sequence: number;
    interactivity: Interactivity<number>;
  }>
> = (state, action) => {
  const magics = judgeSelf(action.payload.player, state)
    ? state.meMagics
    : state.opMagics;
  extendIdleInteractivities(
    magics,
    action.payload.sequence,
    action.payload.interactivity
  );
};

export const clearMagicIdleInteractivitiesImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const magics = judgeSelf(action.payload, state)
    ? state.meMagics
    : state.opMagics;

  clearIdleInteractivities(magics);
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

// 删除魔法陷阱
export const removeMagicImpl: CaseReducer<
  DuelState,
  PayloadAction<{ controler: number; sequence: number }>
> = (state, action) => {
  const controler = action.payload.controler;

  const magics = judgeSelf(controler, state) ? state.meMagics : state.opMagics;

  removeOccupant(magics, action.payload.sequence);
};

// 改变魔法表示形式
export const setMagicPositionImpl: CaseReducer<
  DuelState,
  PayloadAction<{
    controler: number;
    sequence: number;
    position: ygopro.CardPosition;
  }>
> = (state, action) => {
  const controler = action.payload.controler;
  const sequence = action.payload.sequence;
  const position = action.payload.position;

  const magics = judgeSelf(controler, state) ? state.meMagics : state.opMagics;
  setPosition(magics, sequence, position);
};

export const selectMeMagics = (state: RootState) =>
  state.duel.meMagics || { inner: [] };
export const selectOpMagics = (state: RootState) =>
  state.duel.opMagics || { inner: [] };
