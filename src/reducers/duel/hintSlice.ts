import { createAsyncThunk, ActionReducerMapBuilder } from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { RootState } from "../../store";
import { DESCRIPTION_LIMIT, fetchStrings, getStrings } from "../../api/strings";
import { judgeSelf } from "./util";
import { fetchCard } from "../../api/cards";
import { DuelReducer } from "./generic";

export interface HintState {
  code: number;
  msg?: string;
  esHint?: string;
  esSelectHint?: string;
}

export const initHintImpl: DuelReducer<number> = (state, action) => {
  const player = action.payload;

  if (judgeSelf(player, state)) {
    state.meHint = { code: 0 };
  } else {
    state.opHint = { code: 0 };
  }
};

export const setEsHintImpl: DuelReducer<{ player: number; esHint: string }> = (
  state,
  action
) => {
  const player = action.payload.player;
  const esHint = action.payload.esHint;

  const hint = judgeSelf(player, state) ? state.meHint : state.opHint;
  if (hint) {
    hint.esHint = esHint;
  }
};

export const fetchCommonHintMeta = createAsyncThunk(
  "duel/fetchCommonHintMeta",
  async (param: [number, number]) => {
    const player = param[0];
    const hintData = param[1];

    const hintMeta = fetchStrings("!system", hintData);
    const response: [number, string] = [player, hintMeta];

    return response;
  }
);

export const fetchSelectHintMeta = createAsyncThunk(
  "duel/fetchSelectHintMeta",
  async (param: {
    player: number;
    selectHintData: number;
    esHint?: string;
  }) => {
    const player = param.player;
    const selectHintData = param.selectHintData;

    let selectHintMeta = "";
    if (selectHintData > DESCRIPTION_LIMIT) {
      // 针对`MSG_SELECT_PLACE`的特化逻辑
      const cardMeta = await fetchCard(selectHintData, true);
      selectHintMeta = fetchStrings("!system", 569).replace(
        "[%ls]",
        cardMeta.text.name || "[?]"
      );
    } else {
      selectHintMeta = await getStrings(selectHintData);
    }

    return {
      player,
      selectHintMeta,
      esHint: param.esHint,
    };
  }
);

export const hintCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchCommonHintMeta.pending, (state, action) => {
    const player = action.meta.arg[0];
    const code = action.meta.arg[1];

    if (judgeSelf(player, state)) {
      state.meHint = { code };
    } else {
      state.opHint = { code };
    }
  });
  builder.addCase(fetchCommonHintMeta.fulfilled, (state, action) => {
    const player = action.payload[0];
    const hintMeta = action.payload[1];

    const hint = judgeSelf(player, state) ? state.meHint : state.opHint;
    if (hint) {
      hint.msg = hintMeta;
    }
  });

  builder.addCase(fetchSelectHintMeta.pending, (state, action) => {
    const player = action.meta.arg.player;
    const code = action.meta.arg.selectHintData;

    const hint = judgeSelf(player, state) ? state.meHint : state.opHint;
    if (hint) {
      hint.code = code;
    }
  });
  builder.addCase(fetchSelectHintMeta.fulfilled, (state, action) => {
    const player = action.payload.player;
    const selectHintMsg = action.payload.selectHintMeta;
    const esHint = action.payload.esHint;

    const hint = judgeSelf(player, state) ? state.meHint : state.opHint;
    if (hint) {
      if (hint.code > DESCRIPTION_LIMIT) {
        // 针对`MSG_SELECT_PLACE`的特化逻辑
        hint.msg = selectHintMsg;
      } else {
        hint.esSelectHint = selectHintMsg;
        if (esHint) hint.esHint = esHint;
      }
    }
  });
};

export const selectMeHint = (state: RootState) => state.duel.meHint;
export const selectOpHint = (state: RootState) => state.duel.opHint;
