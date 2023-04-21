import {
  ActionReducerMapBuilder,
  CaseReducer,
  createAsyncThunk,
} from "@reduxjs/toolkit";

import { fetchCard } from "@/api/cards";
import { ygopro } from "@/api";
import { RootState } from "@/store";

import { DuelReducer } from "../generic";
import { DuelState } from "../mod";
import { findCardByLocation } from "../util";

// 更新打开状态
export const setCheckCardModalV2IsOpenImpl: DuelReducer<boolean> = (
  state,
  action
) => {
  state.modalState.checkCardModalV2.isOpen = action.payload;
};

// 更新选择数目
export const setCheckCardModalV2MinMaxImpl: DuelReducer<{
  min: number;
  max: number;
}> = (state, action) => {
  state.modalState.checkCardModalV2.selectMin = action.payload.min;
  state.modalState.checkCardModalV2.selectMax = action.payload.max;
};

// 更新是否可以取消
export const setCheckCardModalV2CancelAbleImpl: DuelReducer<boolean> = (
  state,
  action
) => {
  state.modalState.checkCardModalV2.cancelAble = action.payload;
};

// 更新是否可以结束
export const setCheckCardModalV2FinishAbleImpl: DuelReducer<boolean> = (
  state,
  action
) => {
  state.modalState.checkCardModalV2.finishAble = action.payload;
};

// 更新是否可以回应
export const setCheckCardModalV2ResponseAbleImpl: DuelReducer<boolean> = (
  state,
  action
) => {
  state.modalState.checkCardModalV2.responseable = action.payload;
};

// 增加卡牌选项
export const fetchCheckCardMetasV2 = createAsyncThunk(
  "duel/fetchCheckCardMetaV2",
  async (param: {
    selected: boolean;
    options: {
      code: number;
      location: ygopro.CardLocation;
      response: number;
    }[];
  }) => {
    const metas = await Promise.all(
      param.options.map(async (option) => {
        return await fetchCard(option.code, true);
      })
    );
    const response = {
      selected: param.selected,
      metas,
    };

    return response;
  }
);

export const checkCardModalV2Case = (
  builder: ActionReducerMapBuilder<DuelState>
) => {
  builder.addCase(fetchCheckCardMetasV2.pending, (state, action) => {
    const selected = action.meta.arg.selected;
    const options = action.meta.arg.options;

    for (const option of options) {
      if (option.code == 0) {
        const newCode =
          findCardByLocation(state, option.location)?.occupant?.id || 0;
        option.code = newCode;
      }
    }

    if (selected) {
      state.modalState.checkCardModalV2.selectedOptions = options;
    } else {
      state.modalState.checkCardModalV2.selectableOptions = options;
    }
  });
  builder.addCase(fetchCheckCardMetasV2.fulfilled, (state, action) => {
    const selected = action.payload.selected;
    const metas = action.payload.metas;

    const options = selected
      ? state.modalState.checkCardModalV2.selectedOptions
      : state.modalState.checkCardModalV2.selectableOptions;
    options.forEach((option) => {
      metas.forEach((meta) => {
        if (option.code == meta.id) {
          option.name = meta.text.name;
          option.desc = meta.text.desc;
        }
      });
    });
  });
};

export const resetCheckCardModalV2Impl: CaseReducer<DuelState> = (state) => {
  const modalState = state.modalState.checkCardModalV2;
  modalState.isOpen = false;
  modalState.finishAble = false;
  modalState.cancelAble = false;
  modalState.responseable = false;
  modalState.selectableOptions = [];
  modalState.selectedOptions = [];
};

export const selectCheckCardModalV2IsOpen = (state: RootState) =>
  state.duel.modalState.checkCardModalV2.isOpen;
export const selectCheckCardModalV2MinMax = (state: RootState) => {
  return {
    min: state.duel.modalState.checkCardModalV2.selectMin || 0,
    max: state.duel.modalState.checkCardModalV2.selectMax || 0,
  };
};
export const selectCheckCardModalV2CancelAble = (state: RootState) =>
  state.duel.modalState.checkCardModalV2.cancelAble;
export const selectCheckCardModalV2FinishAble = (state: RootState) =>
  state.duel.modalState.checkCardModalV2.finishAble;
export const selectCheckCardModalV2ResponseAble = (state: RootState) =>
  state.duel.modalState.checkCardModalV2.responseable;
export const selectCheckCardModalV2SelectAbleOptions = (state: RootState) =>
  state.duel.modalState.checkCardModalV2.selectableOptions;
export const selectCheckCardModalV2SelectedOptions = (state: RootState) =>
  state.duel.modalState.checkCardModalV2.selectedOptions;
