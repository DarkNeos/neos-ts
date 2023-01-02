import {
  PayloadAction,
  CaseReducer,
  createAsyncThunk,
  ActionReducerMapBuilder,
} from "@reduxjs/toolkit";
import { fetchCard } from "../../api/cards";
import { RootState } from "../../store";
import { DuelState } from "./mod";

export interface ModalState {
  // 卡牌弹窗
  cardModal: {
    isOpen: boolean;
    name?: string;
    desc?: string;
    imgUrl?: string;
    interactivies: { desc: string; response: number }[];
  };
  // 卡牌列表弹窗
  cardListModal: {
    isOpen: boolean;
    list: {
      name?: string;
      desc?: string;
      imgUrl?: string;
    }[];
  };
  // 卡牌选择弹窗
  checkCardModal: {
    isOpen: boolean;
    selectMin?: number;
    selectMax?: number;
    tags: {
      tagName: string;
      options: {
        code: number;
        name?: string;
        desc?: string;
        response: number;
      }[];
    }[];
  };
}

// 更新卡牌弹窗打开状态
export const setCardModalIsOpenImpl: CaseReducer<
  DuelState,
  PayloadAction<boolean>
> = (state, action) => {
  state.modalState.cardModal.isOpen = action.payload;
};

// 更新卡牌弹窗文本
export const setCardModalTextImpl: CaseReducer<
  DuelState,
  PayloadAction<[string?, string?]>
> = (state, action) => {
  const name = action.payload[0];
  const desc = action.payload[1];

  state.modalState.cardModal.name = name;
  state.modalState.cardModal.desc = desc;
};

// 更新卡牌弹窗图片Url
export const setCardModalImgUrlImpl: CaseReducer<
  DuelState,
  PayloadAction<string>
> = (state, action) => {
  state.modalState.cardModal.imgUrl = action.payload;
};

// 更新卡牌弹窗互动选项
export const setCardModalInteractiviesImpl: CaseReducer<
  DuelState,
  PayloadAction<{ desc: string; response: number }[]>
> = (state, action) => {
  state.modalState.cardModal.interactivies = action.payload;
};

// 更新卡牌列表弹窗打开状态
export const setCardListModalIsOpenImpl: CaseReducer<
  DuelState,
  PayloadAction<boolean>
> = (state, action) => {
  state.modalState.cardListModal.isOpen = action.payload;
};

// 更新卡牌列表数据
export const setCardListModalInfoImpl: CaseReducer<
  DuelState,
  PayloadAction<{ name?: string; desc?: string; imgUrl?: string }[]>
> = (state, action) => {
  const list = action.payload;

  state.modalState.cardListModal.list = list;
};

// 更新卡牌选择弹窗打开状态
export const setCheckCardModalIsOpenImpl: CaseReducer<
  DuelState,
  PayloadAction<boolean>
> = (state, action) => {
  state.modalState.checkCardModal.isOpen = action.payload;
};

// 更新卡牌选择弹窗选择数目状态
export const setCheckCardModalMinMaxImpl: CaseReducer<
  DuelState,
  PayloadAction<{ min: number; max: number }>
> = (state, action) => {
  state.modalState.checkCardModal.selectMin = action.payload.min;
  state.modalState.checkCardModal.selectMax = action.payload.max;
};

// 增加卡牌选择选项
export const fetchCheckCardMeta = createAsyncThunk(
  "duel/fetchCheckCardMeta",
  async (param: {
    tagName: string;
    option: { code: number; response: number };
  }) => {
    const meta = await fetchCard(param.option.code);
    const response = {
      tagName: param.tagName,
      meta: {
        code: meta.id,
        name: meta.text.name,
        desc: meta.text.desc,
      },
    };

    return response;
  }
);

export const checkCardModalCase = (
  builder: ActionReducerMapBuilder<DuelState>
) => {
  builder.addCase(fetchCheckCardMeta.pending, (state, action) => {
    const tagName = action.meta.arg.tagName;
    const code = action.meta.arg.option.code;
    const response = action.meta.arg.option.response;

    for (const tag of state.modalState.checkCardModal.tags) {
      if (tag.tagName === tagName) {
        tag.options.push({ code, response });
        return;
      }
    }

    state.modalState.checkCardModal.tags.push({
      tagName,
      options: [{ code, response }],
    });
  });
  builder.addCase(fetchCheckCardMeta.fulfilled, (state, action) => {
    const tagName = action.payload.tagName;
    const meta = action.payload.meta;

    for (const tag of state.modalState.checkCardModal.tags) {
      if (tag.tagName === tagName) {
        for (const option of tag.options) {
          if (option.code == meta.code) {
            option.name = meta.name;
            option.desc = meta.desc;
          }
        }
      }
    }
  });
};

export const selectCardModalIsOpen = (state: RootState) =>
  state.duel.modalState.cardModal.isOpen;
export const selectCardModalName = (state: RootState) =>
  state.duel.modalState.cardModal.name;
export const selectCardModalDesc = (state: RootState) =>
  state.duel.modalState.cardModal.desc;
export const selectCardModalImgUrl = (state: RootState) =>
  state.duel.modalState.cardModal.imgUrl;
export const selectCardModalInteractivies = (state: RootState) =>
  state.duel.modalState.cardModal.interactivies;
export const selectCardListModalIsOpen = (state: RootState) =>
  state.duel.modalState.cardListModal.isOpen;
export const selectCardListModalInfo = (state: RootState) =>
  state.duel.modalState.cardListModal.list;
