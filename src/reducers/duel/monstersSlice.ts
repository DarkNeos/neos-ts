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

export interface MonsterState {
  monsters: CardState[];
}

// 初始化怪兽区状态
export const initMonstersImpl: CaseReducer<DuelState, PayloadAction<number>> = (
  state,
  action
) => {
  const player = action.payload;
  const monsters = {
    monsters: [
      {
        location: new ygopro.CardLocation({
          controler: player,
          location: ygopro.CardZone.MZONE,
          sequence: 0,
        }),
        idleInteractivities: [],
      },
      {
        location: new ygopro.CardLocation({
          controler: player,
          location: ygopro.CardZone.MZONE,
          sequence: 1,
        }),
        idleInteractivities: [],
      },
      {
        location: new ygopro.CardLocation({
          controler: player,
          location: ygopro.CardZone.MZONE,
          sequence: 2,
        }),
        idleInteractivities: [],
      },
      {
        location: new ygopro.CardLocation({
          controler: player,
          location: ygopro.CardZone.MZONE,
          sequence: 3,
        }),
        idleInteractivities: [],
      },
      {
        location: new ygopro.CardLocation({
          controler: player,
          location: ygopro.CardZone.MZONE,
          sequence: 4,
        }),
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
  if (monsters) {
    for (const monster of monsters.monsters) {
      if (monster.location.sequence == sequence) {
        monster.placeInteractivities = {
          interactType: InteractType.PLACE_SELECTABLE,
          response: {
            controler,
            zone: ygopro.CardZone.MZONE,
            sequence,
          },
        };
      }
    }
  }
};

export const clearMonsterPlaceInteractivitiesImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const player = action.payload;

  const monsters = judgeSelf(player, state)
    ? state.meMonsters
    : state.opMonsters;

  if (monsters) {
    for (const monster of monsters.monsters) {
      monster.placeInteractivities = undefined;
    }
  }
};

// 增加怪兽
export const fetchMonsterMeta = createAsyncThunk(
  "duel/fetchMonsterMeta",
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

export const monsterCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchMonsterMeta.pending, (state, action) => {
    // Meta结果没返回之前先更新`ID`
    const controler = action.meta.arg.controler;
    const sequence = action.meta.arg.sequence;
    const position = action.meta.arg.position;
    const code = action.meta.arg.code;

    const meta = { id: code, data: {}, text: {} };
    if (judgeSelf(controler, state)) {
      if (state.meMonsters) {
        for (const monster of state.meMonsters.monsters) {
          if (monster.location.sequence == sequence) {
            monster.occupant = meta;
            monster.location.position = position;
          }
        }
      }
    } else {
      if (state.opMonsters) {
        for (const monster of state.opMonsters.monsters) {
          if (monster.location.sequence == sequence) {
            monster.occupant = meta;
            monster.location.position = position;
          }
        }
      }
    }
  });
  builder.addCase(fetchMonsterMeta.fulfilled, (state, action) => {
    const controler = action.payload.controler;
    const sequence = action.payload.sequence;
    const meta = action.payload.meta;

    if (judgeSelf(controler, state)) {
      if (state.meMonsters) {
        for (const monster of state.meMonsters.monsters) {
          if (monster.location.sequence == sequence) {
            monster.occupant = meta;
          }
        }
      }
    } else {
      if (state.opMonsters) {
        for (const monster of state.opMonsters.monsters) {
          if (monster.location.sequence == sequence) {
            monster.occupant = meta;
          }
        }
      }
    }
  });
};

export const selectMeMonsters = (state: RootState) =>
  state.duel.meMonsters || { monsters: [] };
export const selectOpMonsters = (state: RootState) =>
  state.duel.opMonsters || { monsters: [] };
