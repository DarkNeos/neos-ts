import { createAsyncThunk, ActionReducerMapBuilder } from "@reduxjs/toolkit";
import { DuelState } from "./mod";
import { RootState } from "../../store";
import { DESCRIPTION_LIMIT, fetchStrings, getStrings } from "../../api/strings";
import { findCardByLocation, judgeSelf } from "./util";
import { fetchCard } from "../../api/cards";
import { DuelReducer } from "./generic";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";

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

export const fetchEsHintMeta = createAsyncThunk(
  "duel/fetchEsHintMeta",
  async (param: {
    player: number;
    originMsg: string | number;
    location?: ygopro.CardLocation;
    cardID?: number;
  }) => {
    const player = param.player;
    const originMsg =
      typeof param.originMsg === "string"
        ? param.originMsg
        : fetchStrings("!system", param.originMsg);

    const location = param.location;

    if (param.cardID) {
      const cardMeta = await fetchCard(param.cardID);

      return { player, originMsg, cardMeta, location };
    } else {
      return { player, originMsg, location };
    }
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
  builder.addCase(fetchEsHintMeta.fulfilled, (state, action) => {
    const player = action.payload.player;
    const originMsg = action.payload.originMsg;
    const cardMeta = action.payload.cardMeta;
    const location = action.payload.location;

    const hint = judgeSelf(player, state) ? state.meHint : state.opHint;
    if (hint) {
      let esHint = originMsg;

      if (cardMeta?.text.name) {
        esHint = originMsg.replace("[?]", cardMeta.text.name);
      }

      if (location) {
        const fieldMeta = findCardByLocation(state, location);
        if (fieldMeta?.occupant?.text.name) {
          esHint = originMsg.replace("[?]", fieldMeta.occupant.text.name);
        }
      }

      hint.esHint = esHint;
    }
  });
};

export const selectMeHint = (state: RootState) => state.duel.meHint;
export const selectOpHint = (state: RootState) => state.duel.opHint;
