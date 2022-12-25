import { judgeSelf, Monster } from "./util";
import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { DuelState } from "./mod";

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
