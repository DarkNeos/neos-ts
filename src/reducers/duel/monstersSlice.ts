import { judgeSelf, Monster, InteractType } from "./util";
import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";

export interface MonsterState {
  monsters: Monster[];
}

// 初始化自己的怪兽区状态
export const initMonstersImpl: CaseReducer<DuelState, PayloadAction<number>> = (
  state,
  action
) => {
  const player = action.payload;
  let monsters = judgeSelf(player, state) ? state.meMonsters : state.opMonsters;

  if (!monsters) {
    monsters = {
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
    monsters.monsters = [];
  }
};
