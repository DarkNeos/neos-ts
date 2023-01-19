import { DuelState } from "../mod";
import { DuelReducer } from "../generic";
import {
  ActionReducerMapBuilder,
  CaseReducer,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import { fetchCard } from "../../../api/cards";
import { RootState } from "../../../store";

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

// 增加卡牌选项
export const fetchCheckCardMetaV2 = createAsyncThunk(
  "duel/fetchCheckCardMetaV2",
  async (param: {
    controler: number;
    selected: boolean;
    option: { code: number; response?: number };
  }) => {
    const meta = await fetchCard(param.option.code);
    const response = {
      controler: param.controler,
      selected: param.selected,
      meta: {
        code: meta.id,
        name: meta.text.name,
        desc: meta.text.desc,
      },
    };

    return response;
  }
);

export const checkCardModalV2Case = (
  builder: ActionReducerMapBuilder<DuelState>
) => {
  builder.addCase(fetchCheckCardMetaV2.pending, (state, action) => {
    const selected = action.meta.arg.selected;
    const code = action.meta.arg.option.code;
    const response = action.meta.arg.option.response;

    const options = selected
      ? state.modalState.checkCardModalV2.selectedOptions
      : state.modalState.checkCardModalV2.selectableOptions;
    options.push({ code, response });
  });
  builder.addCase(fetchCheckCardMetaV2.fulfilled, (state, action) => {
    const selected = action.payload.selected;
    const meta = action.payload.meta;

    const options = selected
      ? state.modalState.checkCardModalV2.selectedOptions
      : state.modalState.checkCardModalV2.selectableOptions;
    options.forEach((option) => {
      if (option.code == meta.code) {
        option.name = meta.name;
        option.desc = meta.desc;
      }
    });
  });
};

export const resetCheckCardModalV2Impl: CaseReducer<DuelState> = (state) => {
  const modalState = state.modalState.checkCardModalV2;
  modalState.isOpen = false;
  modalState.finishAble = false;
  modalState.cancelAble = false;
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
export const selectCheckCardModalV2SelectAbleOptions = (state: RootState) =>
  state.duel.modalState.checkCardModalV2.selectableOptions;
export const selectCheckCardModalV2SelectedOptions = (state: RootState) =>
  state.duel.modalState.checkCardModalV2.selectedOptions;
