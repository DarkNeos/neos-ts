import { judgeSelf, Magic, InteractType } from "./util";
import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { RootState } from "../../store";

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
