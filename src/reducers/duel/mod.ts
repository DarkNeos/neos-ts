/*
 * 对局内的状态更新逻辑
 *
 * */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { RootState } from "@/store";

import {
  addCemeteryIdleInteractivitiesImpl,
  cemeteryCase,
  CemeteryState,
  initCemeteryImpl,
  removeCemeteryImpl,
} from "./cemeretySlice";
import {
  clearAllIdleInteractivitiesImpl,
  clearAllPlaceInteractivitiesImpl,
  reloadFieldImpl,
  updateFieldDataImpl,
} from "./commonSlice";
import { DeckState, initDeckImpl } from "./deckSlice";
import {
  addExclusionIdleInteractivitiesImpl,
  exclusionCase,
  ExclusionState,
  initExclusionImpl,
  removeExclusionImpl,
} from "./exclusionSlice";
import {
  addExtraDeckIdleInteractivitiesImpl,
  extraDeckCase,
  ExtraDeckState,
  removeExtraDeckImpl,
} from "./extraDeckSlice";
import {
  addHandsIdleInteractivityImpl,
  clearHandsIdleInteractivityImpl,
  handsCase,
  HandState,
  removeHandImpl,
} from "./handsSlice";
import { hintCase, HintState, initHintImpl } from "./hintSlice";
import { infoInitImpl, InitInfo, updateHpImpl } from "./initInfoSlice";
import {
  addMagicIdleInteractivitiesImpl,
  addMagicPlaceInteractivitiesImpl,
  clearMagicIdleInteractivitiesImpl,
  clearMagicPlaceInteractivitiesImpl,
  initMagicsImpl,
  magicCase,
  MagicState,
  removeMagicImpl,
  setMagicPositionImpl,
} from "./magicSlice";
import {
  checkCardModalCase,
  checkCardModalV2Case,
  checkCardModalV3Case,
  clearCheckCounterImpl,
  ModalState,
  optionModalCase,
  resetCheckCardModalImpl,
  resetCheckCardModalV2Impl,
  resetCheckCardModalV3Impl,
  resetOptionModalImpl,
  resetPositionModalImpl,
  resetSortCardModalImpl,
  setCardListModalInfoImpl,
  setCardListModalIsOpenImpl,
  setCardModalCountersImpl,
  setCardModalInteractiviesImpl,
  setCardModalIsOpenImpl,
  setCardModalMetaImpl,
  setCheckCardMOdalCancelAbleImpl,
  setCheckCardModalCancelResponseImpl,
  setCheckCardModalIsOpenImpl,
  setCheckCardModalMinMaxImpl,
  setCheckCardModalOnSubmitImpl,
  setCheckCardModalV2CancelAbleImpl,
  setCheckCardModalV2FinishAbleImpl,
  setCheckCardModalV2IsOpenImpl,
  setCheckCardModalV2MinMaxImpl,
  setCheckCardModalV2ResponseAbleImpl,
  setCheckCardModalV3AllLevelImpl,
  setCheckCardModalV3IsOpenImpl,
  setCheckCardModalV3MinMaxImpl,
  setCheckCardModalV3OverFlowImpl,
  setCheckCardModalV3ResponseAbleImpl,
  setCheckCounterImpl,
  setOptionModalIsOpenImpl,
  setPositionModalIsOpenImpl,
  setPositionModalPositionsImpl,
  setSortCardModalIsOpenImpl,
  setYesNoModalIsOpenImpl,
  sortCardModalCase,
  YesNoModalCase,
} from "./modal/mod";
import {
  addMonsterIdleInteractivitiesImpl,
  addMonsterPlaceInteractivitiesImpl,
  clearMonsterIdleInteractivitiesImpl,
  clearMonsterPlaceInteractivitiesImpl,
  initMonstersImpl,
  monsterCase,
  MonsterState,
  removeMonsterImpl,
  removeOverlayImpl,
  setMonsterPositionImpl,
  updateMonsterCountersImpl,
} from "./monstersSlice";
import {
  newPhaseImpl,
  PhaseState,
  setEnableBpImpl,
  setEnableEpImpl,
  setEnableM2Impl,
} from "./phaseSlice";
import { TimeLimit, updateTimeLimitImpl } from "./timeLimit";
import { newTurnImpl } from "./turnSlice";
import MsgWin = ygopro.StocGameMessage.MsgWin;

export interface DuelState {
  selfType?: number;
  meInitInfo?: InitInfo; // 自己的初始状态
  opInitInfo?: InitInfo; // 对手的初始状态

  meHands?: HandState; // 自己的手牌
  opHands?: HandState; // 对手的手牌

  meMonsters?: MonsterState; // 自己的怪兽区状态
  opMonsters?: MonsterState; // 对手的怪兽区状态

  meMagics?: MagicState; // 自己的魔法陷阱区状态
  opMagics?: MagicState; // 对手的魔法陷阱区状态

  meCemetery?: CemeteryState; // 自己的墓地状态
  opCemetery?: CemeteryState; // 对手的墓地状态

  meExclusion?: ExclusionState; // 自己的除外区状态
  opExclusion?: ExclusionState; // 对手的除外区状态

  meDeck?: DeckState; // 自己的卡组状态
  opDeck?: DeckState; // 对手的卡组状态

  meExtraDeck?: ExtraDeckState; // 自己的额外卡组状态
  opExtraDeck?: ExtraDeckState; // 对手的额外卡组状态

  meTimeLimit?: TimeLimit; // 自己的计时
  opTimeLimit?: TimeLimit; // 对手的计时

  hint?: HintState;

  currentPlayer?: number; // 当前的操作方

  phase?: PhaseState;

  result?: MsgWin.ActionType;

  waiting?: boolean;

  unimplemented?: number; // 未处理的`Message`

  // UI相关
  modalState: ModalState;
}

const initialState: DuelState = {
  modalState: {
    cardModal: { isOpen: false, interactivies: [], counters: {} },
    cardListModal: { isOpen: false, list: [] },
    checkCardModal: { isOpen: false, cancelAble: false, tags: [] },
    yesNoModal: { isOpen: false },
    positionModal: { isOpen: false, positions: [] },
    optionModal: { isOpen: false, options: [] },
    checkCardModalV2: {
      isOpen: false,
      cancelAble: false,
      finishAble: false,
      responseable: false,
      selectableOptions: [],
      selectedOptions: [],
    },
    checkCardModalV3: {
      isOpen: false,
      overflow: false,
      allLevel: 0,
      mustSelectList: [],
      selectAbleList: [],
    },
    checkCounterModal: {
      isOpen: false,
      options: [],
    },
    sortCardModal: {
      isOpen: false,
      options: [],
    },
  },
};

const duelSlice = createSlice({
  name: "duel",
  initialState,
  reducers: {
    setSelfType: (state, action: PayloadAction<number>) => {
      state.selfType = action.payload;
    },
    infoInit: infoInitImpl,
    updateHp: updateHpImpl,
    updateTurn: newTurnImpl,
    updateTimeLimit: updateTimeLimitImpl,

    // 手牌相关`Reducer`
    clearHandsIdleInteractivity: clearHandsIdleInteractivityImpl,
    addHandsIdleInteractivity: addHandsIdleInteractivityImpl,
    removeHand: removeHandImpl,

    // 怪兽区相关`Reducer`
    initMonsters: initMonstersImpl,
    addMonsterPlaceInteractivities: addMonsterPlaceInteractivitiesImpl,
    clearMonsterPlaceInteractivities: clearMonsterPlaceInteractivitiesImpl,
    addMonsterIdleInteractivities: addMonsterIdleInteractivitiesImpl,
    clearMonsterIdleInteractivities: clearMonsterIdleInteractivitiesImpl,
    setMonsterPosition: setMonsterPositionImpl,
    removeMonster: removeMonsterImpl,
    removeOverlay: removeOverlayImpl,
    updateMonsterCounters: updateMonsterCountersImpl,

    // 魔法陷阱区相关`Reducer`
    initMagics: initMagicsImpl,
    addMagicPlaceInteractivities: addMagicPlaceInteractivitiesImpl,
    clearMagicPlaceInteractivities: clearMagicPlaceInteractivitiesImpl,
    addMagicIdleInteractivities: addMagicIdleInteractivitiesImpl,
    clearMagicIdleInteractivities: clearMagicIdleInteractivitiesImpl,
    setMagicPosition: setMagicPositionImpl,
    removeMagic: removeMagicImpl,

    // 墓地相关`Reducer`
    initCemetery: initCemeteryImpl,
    removeCemetery: removeCemeteryImpl,
    addCemeteryIdleInteractivities: addCemeteryIdleInteractivitiesImpl,

    // 除外区相关`Reducer`
    initExclusion: initExclusionImpl,
    removeExclusion: removeExclusionImpl,
    addExclusionIdleInteractivities: addExclusionIdleInteractivitiesImpl,

    // 卡组相关`Reducer`
    initDeck: initDeckImpl,

    // 额外卡组相关`Reducer`
    removeExtraDeck: removeExtraDeckImpl,
    addExtraDeckIdleInteractivities: addExtraDeckIdleInteractivitiesImpl,

    // 阶段相关
    updatePhase: newPhaseImpl,
    setEnableBp: setEnableBpImpl,
    setEnableM2: setEnableM2Impl,
    setEnableEp: setEnableEpImpl,

    // UI相关`Reducer`
    setCardModalIsOpen: setCardModalIsOpenImpl,
    setCardModalMeta: setCardModalMetaImpl,
    setCardModalInteractivies: setCardModalInteractiviesImpl,
    setCardListModalIsOpen: setCardListModalIsOpenImpl,
    setCardListModalInfo: setCardListModalInfoImpl,
    setCheckCardModalIsOpen: setCheckCardModalIsOpenImpl,
    setCheckCardModalMinMax: setCheckCardModalMinMaxImpl,
    setCheckCardModalOnSubmit: setCheckCardModalOnSubmitImpl,
    setCheckCardMOdalCancelAble: setCheckCardMOdalCancelAbleImpl,
    setCheckCardModalCancelResponse: setCheckCardModalCancelResponseImpl,
    resetCheckCardModal: resetCheckCardModalImpl,
    setYesNoModalIsOpen: setYesNoModalIsOpenImpl,
    setPositionModalIsOpen: setPositionModalIsOpenImpl,
    setPositionModalPositions: setPositionModalPositionsImpl,
    resetPositionModal: resetPositionModalImpl,
    setOptionModalIsOpen: setOptionModalIsOpenImpl,
    resetOptionModal: resetOptionModalImpl,
    setCheckCardModalV2FinishAble: setCheckCardModalV2FinishAbleImpl,
    setCheckCardModalV2MinMax: setCheckCardModalV2MinMaxImpl,
    setCheckCardModalV2CancelAble: setCheckCardModalV2CancelAbleImpl,
    setCheckCardModalV2IsOpen: setCheckCardModalV2IsOpenImpl,
    resetCheckCardModalV2: resetCheckCardModalV2Impl,
    setCheckCardModalV2ResponseAble: setCheckCardModalV2ResponseAbleImpl,
    setCheckCardModalV3IsOpen: setCheckCardModalV3IsOpenImpl,
    setCheckCardModalV3MinMax: setCheckCardModalV3MinMaxImpl,
    setCheckCardModalV3AllLevel: setCheckCardModalV3AllLevelImpl,
    setCheckCardModalV3OverFlow: setCheckCardModalV3OverFlowImpl,
    setCheckCardModalV3ResponseAble: setCheckCardModalV3ResponseAbleImpl,
    resetCheckCardModalV3: resetCheckCardModalV3Impl,
    setCardModalCounters: setCardModalCountersImpl,
    setCheckCounter: setCheckCounterImpl,
    clearCheckCounter: clearCheckCounterImpl,
    setSortCardModalIsOpen: setSortCardModalIsOpenImpl,
    resetSortCardModal: resetSortCardModalImpl,

    // 提示相关`Reducer`
    initHint: initHintImpl,

    // 通用的`Reducer`
    clearAllIdleInteractivities: clearAllIdleInteractivitiesImpl,
    clearAllPlaceInteractivities: clearAllPlaceInteractivitiesImpl,
    updateFieldData: updateFieldDataImpl,
    reloadField: reloadFieldImpl,

    // 对局结果`Reducer`
    setResult: (state, action: PayloadAction<MsgWin.ActionType>) => {
      state.result = action.payload;
    },

    // 等待状态`Reducer`
    setWaiting: (state, action: PayloadAction<boolean>) => {
      state.waiting = action.payload;
    },

    // 未处理状态`Reducer`
    setUnimplemented: (state, action: PayloadAction<number>) => {
      state.unimplemented = action.payload;
    },
  },
  extraReducers(builder) {
    handsCase(builder);
    hintCase(builder);
    monsterCase(builder);
    magicCase(builder);
    cemeteryCase(builder);
    exclusionCase(builder);
    extraDeckCase(builder);
    checkCardModalCase(builder);
    YesNoModalCase(builder);
    optionModalCase(builder);
    checkCardModalV2Case(builder);
    checkCardModalV3Case(builder);
    sortCardModalCase(builder);
  },
});

export const {
  setSelfType,
  infoInit,
  updateHp,
  updateTurn,
  updatePhase,
  setEnableBp,
  setEnableM2,
  setEnableEp,
  clearHandsIdleInteractivity,
  addHandsIdleInteractivity,
  updateTimeLimit,
  setCardModalIsOpen,
  setCardModalMeta,
  setCardModalInteractivies,
  initMonsters,
  addMonsterPlaceInteractivities,
  clearMonsterPlaceInteractivities,
  addMonsterIdleInteractivities,
  clearMonsterIdleInteractivities,
  setMonsterPosition,
  removeMonster,
  updateMonsterCounters,
  removeOverlay,
  initMagics,
  addMagicPlaceInteractivities,
  clearMagicPlaceInteractivities,
  addMagicIdleInteractivities,
  clearMagicIdleInteractivities,
  setMagicPosition,
  removeMagic,
  removeHand,
  initCemetery,
  removeCemetery,
  addCemeteryIdleInteractivities,
  setCardListModalIsOpen,
  setCardListModalInfo,
  setCheckCardModalIsOpen,
  setCheckCardModalMinMax,
  setCheckCardModalOnSubmit,
  setCheckCardMOdalCancelAble,
  setCheckCardModalCancelResponse,
  resetCheckCardModal,
  setYesNoModalIsOpen,
  setPositionModalIsOpen,
  setPositionModalPositions,
  resetPositionModal,
  setOptionModalIsOpen,
  resetOptionModal,
  initDeck,
  removeExtraDeck,
  addExtraDeckIdleInteractivities,
  initExclusion,
  removeExclusion,
  addExclusionIdleInteractivities,
  setCheckCardModalV2IsOpen,
  setCheckCardModalV2MinMax,
  setCheckCardModalV2CancelAble,
  setCheckCardModalV2FinishAble,
  resetCheckCardModalV2,
  setCheckCardModalV2ResponseAble,
  clearAllIdleInteractivities,
  clearAllPlaceInteractivities,
  setResult,
  setWaiting,
  setUnimplemented,
  updateFieldData,
  reloadField,
  setCheckCardModalV3IsOpen,
  setCheckCardModalV3MinMax,
  setCheckCardModalV3AllLevel,
  setCheckCardModalV3OverFlow,
  setCheckCardModalV3ResponseAble,
  resetCheckCardModalV3,
  setCardModalCounters,
  setCheckCounter,
  clearCheckCounter,
  setSortCardModalIsOpen,
  resetSortCardModal,
  initHint,
} = duelSlice.actions;
export const selectDuelHsStart = (state: RootState) => {
  return state.duel.meInitInfo != null;
};
export const selectDuelResult = (state: RootState) => {
  return state.duel.result;
};
export const selectWaiting = (state: RootState) => {
  return state.duel.waiting;
};
export const selectUnimplemented = (state: RootState) => {
  return state.duel.unimplemented;
};
export default duelSlice.reducer;
