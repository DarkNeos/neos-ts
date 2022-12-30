import { judgeSelf, Monster, InteractType } from "./util";
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

export interface MonsterState {
  monsters: Monster[];
}

// 初始化自己的怪兽区状态
export const initMonstersImpl: CaseReducer<DuelState, PayloadAction<number>> = (
  state,
  action
) => {
  const player = action.payload;
  const monsters = {
    monsters: [
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
    state.meMonsters = monsters;
  } else {
    state.opMonsters = monsters;
  }
};

export const addMonsterPlaceSelectAbleImpl: CaseReducer<
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
      if (monster.sequence == sequence) {
        monster.selectInfo = {
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

export const clearMonsterSelectInfoImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  const player = action.payload;

  const monsters = judgeSelf(player, state)
    ? state.meMonsters
    : state.opMonsters;

  if (monsters) {
    for (const monster of monsters.monsters) {
      monster.selectInfo = undefined;
    }
  }
};

// 增加怪兽
export const fetchMonsterMeta = createAsyncThunk(
  "duel/fetchMonsterMeta",
  async (param: [number, number, number]) => {
    const controler = param[0];
    const sequence = param[1];
    const code = param[2];

    const meta = await fetchCard(code);
    const response: [number, number, CardMeta] = [controler, sequence, meta];

    return response;
  }
);

export const monsterCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchMonsterMeta.pending, (state, action) => {
    // Meta结果没返回之前先更新`ID`
    const controler = action.meta.arg[0];
    const sequence = action.meta.arg[1];
    const code = action.meta.arg[2];

    const cardMeta = { id: code, data: {}, text: {} };
    if (judgeSelf(controler, state)) {
      if (state.meMonsters) {
        for (const monster of state.meMonsters.monsters) {
          if (monster.sequence == sequence) {
            monster.occupant = cardMeta;
          }
        }
      }
    } else {
      if (state.opMonsters) {
        for (const monster of state.opMonsters.monsters) {
          if (monster.sequence == sequence) {
            monster.occupant = cardMeta;
          }
        }
      }
    }
  });
  builder.addCase(fetchMonsterMeta.fulfilled, (state, action) => {
    const controler = action.payload[0];
    const sequence = action.payload[1];
    const meta = action.payload[2];

    if (judgeSelf(controler, state)) {
      if (state.meMonsters) {
        for (const monster of state.meMonsters.monsters) {
          if (monster.sequence == sequence) {
            monster.occupant = meta;
          }
        }
      }
    } else {
      if (state.opMonsters) {
        for (const monster of state.opMonsters.monsters) {
          if (monster.sequence == sequence) {
            monster.occupant = meta;
          }
        }
      }
    }
  });
};

export const selectMeMonsters = (state: RootState) =>
  state.duel.meMonsters || { monsters: [] };
