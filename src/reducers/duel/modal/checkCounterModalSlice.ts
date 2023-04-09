// 后续对于`MSG_SELECT_XXX`的处理UI都尽量用`Babylon.js`实现而不会通过`Antd`的`Modal`实现，因此这里不追求工程质量，暂时简单实现下。
import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { RootState } from "@/store";
import { DuelState } from "../mod";
import { findCardByLocation } from "../util";
import { ygopro } from "@/api/ocgcore/idl/ocgcore";
type SelectCounter = ReturnType<
  typeof ygopro.StocGameMessage.MsgSelectCounter.prototype.toObject
>;

export const setCheckCounterImpl: CaseReducer<
  DuelState,
  PayloadAction<SelectCounter>
> = (state, action) => {
  const modal = state.modalState.checkCounterModal;
  const payload = action.payload;

  modal.counterType = payload.counter_type;
  modal.min = payload.min;
  modal.options = payload.options!.map((option) => {
    const code = option.code
      ? option.code
      : findCardByLocation(state, option.location!)?.occupant?.id || 0;

    return {
      code,
      max: option.counter_count!,
    };
  });
  modal.isOpen = true;
};

export const clearCheckCounterImpl: CaseReducer<DuelState> = (state) => {
  state.modalState.checkCounterModal.isOpen = false;
  state.modalState.checkCounterModal.min = undefined;
  state.modalState.checkCounterModal.counterType = undefined;
  state.modalState.checkCounterModal.options = [];
};

export const selectCheckCounterModal = (state: RootState) =>
  state.duel.modalState.checkCounterModal;
