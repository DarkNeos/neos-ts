import {
  PayloadAction,
  CaseReducer,
  createAsyncThunk,
  ActionReducerMapBuilder,
} from "@reduxjs/toolkit";
import { RootState } from "../../../store";
import { DuelState } from "../mod";
import { findCardByLocation, judgeSelf } from "../util";
import { fetchCard, getCardStr } from "../../../api/cards";
import { ygopro } from "../../../api/ocgcore/idl/ocgcore";

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

// 更新卡牌选择弹窗的提交回调
export const setCheckCardModalOnSubmitImpl: CaseReducer<
  DuelState,
  PayloadAction<string>
> = (state, action) => {
  state.modalState.checkCardModal.onSubmit = action.payload;
};

// 更新卡牌选择弹窗是否可以取消
export const setCheckCardMOdalCancelAbleImpl: CaseReducer<
  DuelState,
  PayloadAction<boolean>
> = (state, action) => {
  state.modalState.checkCardModal.cancelAble = action.payload;
};

// 更新卡牌选择弹窗取消时返回给服务端的`Response`
export const setCheckCardModalCancelResponseImpl: CaseReducer<
  DuelState,
  PayloadAction<number>
> = (state, action) => {
  state.modalState.checkCardModal.cancelResponse = action.payload;
};

// 增加卡牌选择选项
export const fetchCheckCardMeta = createAsyncThunk(
  "duel/fetchCheckCardMeta",
  async (param: {
    tagName: string;
    option: {
      code: number;
      location: ygopro.CardLocation;
      response: number;
      effectDescCode?: number;
    };
  }) => {
    // FIXME: 这里如果传的`controler`如果是对手，对应的`code`会为零，这时候就无法更新对应的`Meta`信息了，后续需要修复。`fetchCheckCardMetaV2`和`fetchCheckCardMetaV3`同理
    const meta = await fetchCard(param.option.code, true);
    const effectDesc = param.option.effectDescCode
      ? getCardStr(meta, param.option.effectDescCode & 0xf)
      : undefined;
    const response = {
      controler: param.option.location.controler,
      tagName: param.tagName,
      meta: {
        code: meta.id,
        name: meta.text.name,
        desc: meta.text.desc,
        effectDesc,
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
    const location = action.meta.arg.option.location;
    const controler = location.controler;
    const response = action.meta.arg.option.response;

    const combinedTagName = judgeSelf(controler, state)
      ? `我方的${tagName}`
      : `对方的${tagName}`;

    const newID =
      code != 0 ? code : findCardByLocation(state, location)?.occupant?.id || 0;

    if (newID) {
      for (const tag of state.modalState.checkCardModal.tags) {
        if (tag.tagName === combinedTagName) {
          tag.options.push({ code: newID, response });
          return;
        }
      }

      state.modalState.checkCardModal.tags.push({
        tagName: combinedTagName,
        options: [{ code: newID, response }],
      });
    }
  });
  builder.addCase(fetchCheckCardMeta.fulfilled, (state, action) => {
    const controler = action.payload.controler;
    const tagName = action.payload.tagName;
    const meta = action.payload.meta;

    const combinedTagName = judgeSelf(controler, state)
      ? `我方的${tagName}`
      : `对方的${tagName}`;

    for (const tag of state.modalState.checkCardModal.tags) {
      if (tag.tagName === combinedTagName) {
        for (const option of tag.options) {
          if (option.code == meta.code) {
            option.name = meta.name;
            option.desc = meta.desc;
            option.effectDesc = meta.effectDesc;
          }
        }
      }
    }
  });
};

export const resetCheckCardModalImpl: CaseReducer<DuelState> = (state) => {
  state.modalState.checkCardModal.isOpen = false;
  state.modalState.checkCardModal.selectMin = undefined;
  state.modalState.checkCardModal.selectMax = undefined;
  state.modalState.checkCardModal.cancelAble = false;
  state.modalState.checkCardModal.cancelResponse = undefined;
  state.modalState.checkCardModal.tags = [];
};

export const selectCheckCardModalIsOpen = (state: RootState) =>
  state.duel.modalState.checkCardModal.isOpen;
export const selectCheckCardModalMinMax = (state: RootState) => {
  return {
    min: state.duel.modalState.checkCardModal.selectMin || 0,
    max: state.duel.modalState.checkCardModal.selectMax || 0,
  };
};
export const selectCheckCardModalTags = (state: RootState) =>
  state.duel.modalState.checkCardModal.tags;
export const selectCheckCardModalOnSubmit = (state: RootState) =>
  state.duel.modalState.checkCardModal.onSubmit;
export const selectCheckCardModalCancelAble = (state: RootState) =>
  state.duel.modalState.checkCardModal.cancelAble;
export const selectCheckCardModalCacnelResponse = (state: RootState) =>
  state.duel.modalState.checkCardModal.cancelResponse;
