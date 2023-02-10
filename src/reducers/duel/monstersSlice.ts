import { judgeSelf } from "./util";
import {
  PayloadAction,
  CaseReducer,
  ActionReducerMapBuilder,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { RootState } from "../../store";
import {
  DuelFieldState,
  Interactivity,
  createAsyncMetaThunk,
  extendOccupant,
  extendPlaceInteractivity,
  clearPlaceInteractivities,
  removeOccupant,
  extendIdleInteractivities,
  clearIdleInteractivities,
  setPosition,
  removeOverlay,
} from "./generic";
import { fetchCard } from "../../api/cards";

export interface MonsterState extends DuelFieldState {}

// 初始化怪兽区状态
export const initMonstersImpl: CaseReducer<DuelState, PayloadAction<number>> = (
  state,
  action
) => {
  const player = action.payload;
  const monsters = {
    inner: [
      {
        location: {
          controler: player,
          location: ygopro.CardZone.MZONE,
          sequence: 0,
        },
        idleInteractivities: [],
      },
      {
        location: {
          controler: player,
          location: ygopro.CardZone.MZONE,
          sequence: 1,
        },
        idleInteractivities: [],
      },
      {
        location: {
          controler: player,
          location: ygopro.CardZone.MZONE,
          sequence: 2,
        },
        idleInteractivities: [],
      },
      {
        location: {
          controler: player,
          location: ygopro.CardZone.MZONE,
          sequence: 3,
        },
        idleInteractivities: [],
      },
      {
        location: {
          controler: player,
          location: ygopro.CardZone.MZONE,
          sequence: 4,
        },
        idleInteractivities: [],
      },
      {
        location: {
          controler: player,
          location: ygopro.CardZone.MZONE,
          sequence: 5,
        },
        idleInteractivities: [],
      },
      {
        location: {
          controler: player,
          location: ygopro.CardZone.MZONE,
          sequence: 6,
        },
        idleInteractivities: [],
      },
    ],
  };

  if (judgeSelf(player, state)) {
    state.meMonsters = monsters;
  } else {
    state.opMonsters = monsters;
  }
};

export const addMonsterPlaceInteractivitiesImpl: CaseReducer<
  DuelState,
  PayloadAction<[number, number]>
> = (state, action) => {
  const controler = action.payload[0];
  const sequence = action.payload[1];

  const monsters = judgeSelf(controler, state)
    ? state.meMonsters
    : state.opMonsters;
  extendPlaceInteractivity(
    monsters,
    controler,
    sequence,
    ygopro.CardZone.MZONE
  );
};

export const clearMonsterPlaceInteractivitiesImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const player = action.payload;

  const monsters = judgeSelf(player, state)
    ? state.meMonsters
    : state.opMonsters;

  clearPlaceInteractivities(monsters);
};

export const addMonsterIdleInteractivitiesImpl: CaseReducer<
  DuelState,
  PayloadAction<{
    player: number;
    sequence: number;
    interactivity: Interactivity<number>;
  }>
> = (state, action) => {
  const monsters = judgeSelf(action.payload.player, state)
    ? state.meMonsters
    : state.opMonsters;
  extendIdleInteractivities(
    monsters,
    action.payload.sequence,
    action.payload.interactivity
  );
};

export const clearMonsterIdleInteractivitiesImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const monsters = judgeSelf(action.payload, state)
    ? state.meMonsters
    : state.opMonsters;

  clearIdleInteractivities(monsters);
};

// 增加怪兽
export const fetchMonsterMeta = createAsyncMetaThunk("duel/fetchMonsterMeta");

// 增加怪兽的超量素材
export const fetchOverlayMeta = createAsyncThunk(
  "duel/fetchOverlayMeta",
  async (param: {
    controler: number;
    sequence: number;
    overlayCodes: number[];
  }) => {
    const controler = param.controler;
    const sequence = param.sequence;
    const overlayCodes = param.overlayCodes;

    const metas = await Promise.all(
      overlayCodes.map(async (id) => {
        if (id == 0) {
          return { id, data: {}, text: {} };
        } else {
          return await fetchCard(id, true);
        }
      })
    );
    const response = { controler, sequence, metas };

    return response;
  }
);

export const monsterCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchMonsterMeta.pending, (state, action) => {
    // Meta结果没返回之前先更新`ID`
    const controler = action.meta.arg.controler;
    const sequence = action.meta.arg.sequence;
    const position = action.meta.arg.position;
    const code = action.meta.arg.code;

    const meta = { id: code, data: {}, text: {} };
    if (judgeSelf(controler, state)) {
      extendOccupant(state.meMonsters, meta, sequence, position);
    } else {
      extendOccupant(state.opMonsters, meta, sequence, position);
    }
  });
  builder.addCase(fetchMonsterMeta.fulfilled, (state, action) => {
    const controler = action.payload.controler;
    const sequence = action.payload.sequence;
    const meta = action.payload.meta;

    if (judgeSelf(controler, state)) {
      extendOccupant(state.meMonsters, meta, sequence);
    } else {
      extendOccupant(state.opMonsters, meta, sequence);
    }
  });

  builder.addCase(fetchOverlayMeta.pending, (state, action) => {
    // Meta结果没返回之前先更新`ID`
    const controler = action.meta.arg.controler;
    const sequence = action.meta.arg.sequence;
    const overlayCodes = action.meta.arg.overlayCodes;

    const metas = overlayCodes.map((id) => {
      return { id, data: {}, text: {} };
    });
    const monsters = judgeSelf(controler, state)
      ? state.meMonsters
      : state.opMonsters;
    if (monsters) {
      const target = monsters.inner.find((_, idx) => idx == sequence);
      if (target && target.occupant) {
        target.overlay_materials = metas;
      }
    }
  });
  builder.addCase(fetchOverlayMeta.fulfilled, (state, action) => {
    const controler = action.payload.controler;
    const sequence = action.payload.sequence;
    const overlayMetas = action.payload.metas;

    const monsters = judgeSelf(controler, state)
      ? state.meMonsters
      : state.opMonsters;
    if (monsters) {
      const target = monsters.inner.find((_, idx) => idx == sequence);
      if (target && target.occupant) {
        target.overlay_materials = overlayMetas;
      }
    }
  });
};

// 删除怪兽
export const removeMonsterImpl: CaseReducer<
  DuelState,
  PayloadAction<{ controler: number; sequence: number }>
> = (state, action) => {
  const controler = action.payload.controler;

  const monsters = judgeSelf(controler, state)
    ? state.meMonsters
    : state.opMonsters;

  removeOccupant(monsters, action.payload.sequence);
  removeOverlay(monsters, action.payload.sequence);
};

// 删除超量素材
export const removeOverlayImpl: CaseReducer<
  DuelState,
  PayloadAction<{
    controler: number;
    sequence: number;
    overlaySequence: number;
  }>
> = (state, action) => {
  const controler = action.payload.controler;
  const sequence = action.payload.sequence;
  const overlaySequence = action.payload.overlaySequence;

  const monsters = judgeSelf(controler, state)
    ? state.meMonsters
    : state.opMonsters;
  if (monsters) {
    const target = monsters.inner.find((_, idx) => idx == sequence);
    if (target && target.overlay_materials) {
      target.overlay_materials = target.overlay_materials.filter(
        (_, idx) => idx != overlaySequence
      );
    }
  }
};

// 改变怪兽表示形式
export const setMonsterPositionImpl: CaseReducer<
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

  const monsters = judgeSelf(controler, state)
    ? state.meMonsters
    : state.opMonsters;
  setPosition(monsters, sequence, position);
};

export const selectMeMonsters = (state: RootState) =>
  state.duel.meMonsters || { inner: [] };
export const selectOpMonsters = (state: RootState) =>
  state.duel.opMonsters || { inner: [] };
