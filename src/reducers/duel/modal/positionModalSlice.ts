import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import { RootState } from "../../../store";
import { DuelState } from "../mod";
import { ygopro } from "../../../api/ocgcore/idl/ocgcore";

export const setPositionModalIsOpenImpl: CaseReducer<
  DuelState,
  PayloadAction<boolean>
> = (state, action) => {
  state.modalState.positionModal.isOpen = action.payload;
};

export const setPositionModalPositionsImpl: CaseReducer<
  DuelState,
  PayloadAction<ygopro.CardPosition[]>
> = (state, action) => {
  state.modalState.positionModal.positions = action.payload;
};

export const resetPositionModalImpl: CaseReducer<DuelState> = (state) => {
  state.modalState.positionModal.isOpen = false;
  state.modalState.positionModal.positions = [];
};

export const selectPositionModalIsOpen = (state: RootState) =>
  state.duel.modalState.positionModal.isOpen;
export const selectPositionModalPositions = (state: RootState) =>
  state.duel.modalState.positionModal.positions;
