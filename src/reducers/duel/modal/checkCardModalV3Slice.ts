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
export const setCheckCardModalV3IsOpenImpl: DuelReducer<boolean> = (
  state,
  action
) => {
  state.modalState.checkCardModalV3.isOpen = action.payload;
};

// 更新选择数目
export const setCheckCardModalV3MinMaxImpl: DuelReducer<{
  min: number;
  max: number;
}> = (state, action) => {
  state.modalState.checkCardModalV3.selectMin = action.payload.min;
  state.modalState.checkCardModalV3.selectMax = action.payload.max;
};

export const setCheckCardModalV3AllLevelImpl: DuelReducer<number> = (
  state,
  action
) => {
  state.modalState.checkCardModalV3.allLevel = action.payload;
};

export const setCheckCardModalV3OverFlowImpl: DuelReducer<boolean> = (
  state,
  action
) => {
  state.modalState.checkCardModalV3.overflow = action.payload;
};

export const setCheckCardModalV3ResponseAbleImpl: DuelReducer<boolean> = (
  state,
  action
) => {
  state.modalState.checkCardModalV3.responseable = action.payload;
};

// 增加卡牌选项
export const fetchCheckCardMetasV3 = createAsyncThunk(
  "duel/fetchCheckCardMetaV3",
  async (param: {
    mustSelect: boolean;
    options: {
      code: number;
      level1: number;
      level2: number;
      response: number;
    }[];
  }) => {
    const metas = await Promise.all(
      param.options.map(async (option) => {
        return await fetchCard(option.code, true);
      })
    );
    const response = {
      mustSelect: param.mustSelect,
      metas,
    };

    return response;
  }
);

export const checkCardModalV3Case = (
  builder: ActionReducerMapBuilder<DuelState>
) => {
  builder.addCase(fetchCheckCardMetasV3.pending, (state, action) => {
    const mustSelect = action.meta.arg.mustSelect;
    const options = action.meta.arg.options.map((option) => {
      return {
        meta: { id: option.code, data: {}, text: {} },
        level1: option.level1,
        level2: option.level2,
        response: option.response,
      };
    });

    if (mustSelect) {
      state.modalState.checkCardModalV3.mustSelectList = options;
    } else {
      state.modalState.checkCardModalV3.selectAbleList = options;
    }
  });
  builder.addCase(fetchCheckCardMetasV3.fulfilled, (state, action) => {
    const mustSelect = action.payload.mustSelect;
    const metas = action.payload.metas;

    const options = mustSelect
      ? state.modalState.checkCardModalV3.mustSelectList
      : state.modalState.checkCardModalV3.selectAbleList;
    options.forEach((option) => {
      metas.forEach((meta) => {
        if (option.meta.id == meta.id) {
          option.meta = meta;
        }
      });
    });
  });
};

export const resetCheckCardModalV3Impl: CaseReducer<DuelState> = (state) => {
  const modalState = state.modalState.checkCardModalV3;
  modalState.isOpen = false;
  modalState.overflow = false;
  modalState.allLevel = undefined;
  modalState.responseable = undefined;
  modalState.mustSelectList = [];
  modalState.selectAbleList = [];
};

export const selectCheckCardModalV3 = (state: RootState) =>
  state.duel.modalState.checkCardModalV3;
