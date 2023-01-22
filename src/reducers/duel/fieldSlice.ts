import { judgeSelf } from "./util";
import { DuelState } from "./mod";
import { RootState } from "../../store";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import {
  PayloadAction,
  CaseReducer,
  ActionReducerMapBuilder,
} from "@reduxjs/toolkit";
import {
  CardState,
  createAsyncMetaThunk,
  DuelReducer,
  Interactivity,
  InteractType,
} from "./generic";

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

export const addFieldPlaceInteractivitiesImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const controler = action.payload;

  const field = judgeSelf(controler, state) ? state.meField : state.opField;
  if (field && field.inner) {
    field.inner.placeInteractivities = {
      interactType: InteractType.PLACE_SELECTABLE,
      response: {
        controler,
        zone: ygopro.CardZone.ONFIELD,
        sequence: 0,
      },
    };
  }
};

export const clearFieldPlaceInteractivitiesImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const player = action.payload;

  const field = judgeSelf(player, state) ? state.meField : state.opField;
  if (field && field.inner) {
    field.inner.placeInteractivities = undefined;
  }
};

export const addFieldIdleInteractivitiesImpl: CaseReducer<
  DuelState,
  PayloadAction<{
    player: number;
    sequence: number;
    interactivity: Interactivity<number>;
  }>
> = (state, action) => {
  const field = judgeSelf(action.payload.player, state)
    ? state.meField
    : state.opField;

  if (field && field.inner) {
    field.inner.idleInteractivities.push(action.payload.interactivity);
  }
};

export const clearFieldIdleInteractivitiesImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const field = judgeSelf(action.payload, state)
    ? state.meField
    : state.opField;

  if (field && field.inner) {
    field.inner.idleInteractivities = [];
  }
};

// 增加场地区
export const fetchFieldMeta = createAsyncMetaThunk("duel/fetchFieldMeta");

export const fieldCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchFieldMeta.pending, (state, action) => {
    const controler = action.meta.arg.controler;
    const sequence = action.meta.arg.sequence;
    const code = action.meta.arg.code;

    if (sequence == 0) {
      const meta = { id: code, data: {}, text: {} };
      const field = judgeSelf(controler, state) ? state.meField : state.opField;
      if (field && field.inner) {
        field.inner.occupant = meta;
      }
    }
  });

  builder.addCase(fetchFieldMeta.fulfilled, (state, action) => {
    const controler = action.payload.controler;
    const meta = action.payload.meta;

    const field = judgeSelf(controler, state) ? state.meField : state.opField;
    if (field && field.inner) {
      field.inner.occupant = meta;
    }
  });
};

// 删除场地区
export const removeFieldImpl: DuelReducer<{ controler: number }> = (
  state,
  action
) => {
  const controler = action.payload.controler;

  const field = judgeSelf(controler, state) ? state.meField : state.opField;
  if (field && field.inner) {
    field.inner.occupant = undefined;
  }
};

export const selectMeField = (state: RootState) => state.duel.meField;
export const selectOpField = (state: RootState) => state.duel.opField;
