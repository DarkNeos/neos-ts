import { createAsyncThunk, ActionReducerMapBuilder } from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { RootState } from "../../store";
import { fetchStrings } from "../../api/strings";
import { judgeSelf } from "./util";

export interface HintState {
  code: number;
  msg?: string;
}

export const fetchHintMeta = createAsyncThunk(
  "duel/fetchHintMeta",
  async (param: [number, number]) => {
    const player = param[0];
    const hintData = param[1];

    const hintMeta = await fetchStrings("!system", hintData);
    const response: [number, string] = [player, hintMeta];

    return response;
  }
);

export const hintCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchHintMeta.pending, (state, action) => {
    const player = action.meta.arg[0];
    const code = action.meta.arg[1];

    if (judgeSelf(player, state)) {
      state.meHint = { code };
    } else {
      state.opHint = { code };
    }
  });
  builder.addCase(fetchHintMeta.fulfilled, (state, action) => {
    const player = action.payload[0];
    const hintMeta = action.payload[1];

    const hint = judgeSelf(player, state) ? state.meHint : state.opHint;
    if (hint) {
      hint.msg = hintMeta;
    }
  });
};

export const selectMeHint = (state: RootState) => state.duel.meHint;
export const selectOpHint = (state: RootState) => state.duel.opHint;
