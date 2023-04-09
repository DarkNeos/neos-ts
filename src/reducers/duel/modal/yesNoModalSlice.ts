import {
  PayloadAction,
  CaseReducer,
  createAsyncThunk,
  ActionReducerMapBuilder,
} from "@reduxjs/toolkit";
import { CardMeta, fetchCard } from "@/api/cards";
import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { fetchStrings, getStrings } from "@/api/strings";
import { RootState } from "@/store";
import { DuelState } from "../mod";

// 更新YesNo弹窗是否打开状态
export const setYesNoModalIsOpenImpl: CaseReducer<
  DuelState,
  PayloadAction<boolean>
> = (state, action) => {
  state.modalState.yesNoModal.isOpen = action.payload;
};

// 设置YesNo弹窗展示内容
export const fetchYesNoMeta = createAsyncThunk(
  "duel/fetchYesNoMeta",
  async (param: {
    code: number;
    location: ygopro.CardLocation;
    descCode: number;
    textGenerator: (
      desc: string,
      cardMeta: CardMeta,
      cardLocation: ygopro.CardLocation
    ) => string;
  }) => {
    const desc = fetchStrings("!system", param.descCode);
    const meta = await fetchCard(param.code, true);

    // TODO: 国际化文案
    return param.textGenerator(desc, meta, param.location);
  }
);

export const fetchYesNoMetaWithEffecDesc = createAsyncThunk(
  "duel/fetchYesNoMetaWithEffecDesc",
  async (effectDesc: number) => {
    return getStrings(effectDesc);
  }
);

export const YesNoModalCase = (builder: ActionReducerMapBuilder<DuelState>) => {
  builder.addCase(fetchYesNoMeta.fulfilled, (state, action) => {
    state.modalState.yesNoModal.msg = action.payload;
  });
  builder.addCase(fetchYesNoMetaWithEffecDesc.fulfilled, (state, action) => {
    state.modalState.yesNoModal.msg = action.payload;
  });
};

export const selectYesNoModalIsOpen = (state: RootState) =>
  state.duel.modalState.yesNoModal.isOpen;
export const selectYesNOModalMsg = (state: RootState) =>
  state.duel.modalState.yesNoModal.msg;
