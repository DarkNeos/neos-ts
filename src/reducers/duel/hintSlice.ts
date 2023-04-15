import { ActionReducerMapBuilder, createAsyncThunk } from "@reduxjs/toolkit";

import { fetchCard } from "@/api/cards";
import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { DESCRIPTION_LIMIT, fetchStrings, getStrings } from "@/api/strings";
import { RootState } from "@/store";

import { DuelReducer } from "./generic";
import { DuelState } from "./mod";
import { findCardByLocation } from "./util";

export interface HintState {
  code: number;
  msg?: string;
  esHint?: string;
  esSelectHint?: string;
}

export const initHintImpl: DuelReducer<void> = (state) => {
  state.hint = { code: 0 };
};

export const fetchCommonHintMeta = createAsyncThunk(
  "duel/fetchCommonHintMeta",
  async (hintData: number) => {
    return fetchStrings("!system", hintData);
  }
);

export const fetchSelectHintMeta = createAsyncThunk(
  "duel/fetchSelectHintMeta",
  async (param: { selectHintData: number; esHint?: string }) => {
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
      selectHintMeta,
      esHint: param.esHint,
    };
  }
);

export const fetchEsHintMeta = createAsyncThunk(
  "duel/fetchEsHintMeta",
  async (param: {
    originMsg: string | number;
    location?: ygopro.CardLocation;
    cardID?: number;
  }) => {
    const originMsg =
      typeof param.originMsg === "string"
        ? param.originMsg
        : fetchStrings("!system", param.originMsg);

    const location = param.location;

    if (param.cardID) {
      const cardMeta = await fetchCard(param.cardID, true);

      return { originMsg, cardMeta, location };
    } else {
      return { originMsg, location };
    }
  }
);

export const hintCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchCommonHintMeta.pending, (state, action) => {
    const code = action.meta.arg;

    if (state.hint) {
      state.hint.code = code;
    }
  });
  builder.addCase(fetchCommonHintMeta.fulfilled, (state, action) => {
    const hintMeta = action.payload;

    if (state.hint) {
      state.hint.msg = hintMeta;
    }
  });

  builder.addCase(fetchSelectHintMeta.pending, (state, action) => {
    const code = action.meta.arg.selectHintData;

    if (state.hint) {
      state.hint.code = code;
    }
  });
  builder.addCase(fetchSelectHintMeta.fulfilled, (state, action) => {
    const selectHintMsg = action.payload.selectHintMeta;
    const esHint = action.payload.esHint;

    const hint = state.hint;
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
    const originMsg = action.payload.originMsg;
    const cardMeta = action.payload.cardMeta;
    const location = action.payload.location;

    const hint = state.hint;
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

export const selectHint = (state: RootState) => state.duel.hint;
