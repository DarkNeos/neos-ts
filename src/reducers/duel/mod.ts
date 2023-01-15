/*
 * 对局内的状态更新逻辑
 *
 * */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitInfo, infoInitImpl } from "./initInfoSlice";
import { TimeLimit, updateTimeLimitImpl } from "./timeLimit";
import {
  HandState,
  handsCase,
  clearHandsIdleInteractivityImpl,
  addHandsIdleInteractivityImpl,
  removeHandImpl,
} from "./handsSlice";
import { newTurnImpl } from "./turnSlice";
import {
  newPhaseImpl,
  PhaseState,
  setEnableBpImpl,
  setEnableEpImpl,
} from "./phaseSlice";
import { RootState } from "../../store";
import { HintState, hintCase } from "./hintSlice";
import {
  ModalState,
  setCardModalIsOpenImpl,
  setCardModalTextImpl,
  setCardModalImgUrlImpl,
  setCardModalInteractiviesImpl,
  setCardListModalIsOpenImpl,
  setCardListModalInfoImpl,
  setCheckCardModalIsOpenImpl,
  setCheckCardModalMinMaxImpl,
  setCheckCardModalOnSubmitImpl,
  setCheckCardMOdalCancelAbleImpl,
  setCheckCardModalCancelResponseImpl,
  resetCheckCardModalImpl,
  setYesNoModalIsOpenImpl,
  checkCardModalCase,
  YesNoModalCase,
  setPositionModalIsOpenImpl,
  setPositionModalPositionsImpl,
  resetPositionModalImpl,
  setOptionModalIsOpenImpl,
  resetOptionModalImpl,
  optionModalCase,
} from "./modal/mod";
import {
  MonsterState,
  initMonstersImpl,
  addMonsterPlaceInteractivitiesImpl,
  clearMonsterPlaceInteractivitiesImpl,
  addMonsterIdleInteractivitiesImpl,
  clearMonsterIdleInteractivitiesImpl,
  removeMonsterImpl,
  monsterCase,
} from "./monstersSlice";
import {
  MagicState,
  initMagicsImpl,
  addMagicPlaceInteractivitiesImpl,
  clearMagicPlaceInteractivitiesImpl,
  addMagicIdleInteractivitiesImpl,
  clearMagicIdleInteractivitiesImpl,
  removeMagicImpl,
  magicCase,
} from "./magicSlice";
import { CemeteryState, initCemeteryImpl, cemeteryCase } from "./cemeretySlice";
import {
  ExclusionState,
  initExclusionImpl,
  exclusionCase,
} from "./exclusionSlice";
import { DeckState, initDeckImpl } from "./deckSlice";
import {
  FieldState,
  initFieldImpl,
  clearFieldPlaceInteractivitiesImpl,
  addFieldPlaceInteractivitiesImpl,
  addFieldIdleInteractivitiesImpl,
  clearFieldIdleInteractivitiesImpl,
} from "./fieldSlice";

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

  meField?: FieldState; // 自己的场地区状态
  opField?: FieldState; // 对手的场地区状态

  meTimeLimit?: TimeLimit; // 自己的计时
  opTimeLimit?: TimeLimit; // 对手的计时

  meHint?: HintState; // 自己的提示
  opHint?: HintState; // 对手的提示

  currentPlayer?: number; // 当前的操作方

  phase?: PhaseState;

  // UI相关
  modalState: ModalState;
}

const initialState: DuelState = {
  modalState: {
    cardModal: { isOpen: false, interactivies: [] },
    cardListModal: { isOpen: false, list: [] },
    checkCardModal: { isOpen: false, cancelAble: false, tags: [] },
    yesNoModal: { isOpen: false },
    positionModal: { isOpen: false, positions: [] },
    optionModal: { isOpen: false, options: [] },
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
    removeMonster: removeMonsterImpl,

    // 魔法陷阱区相关`Reducer`
    initMagics: initMagicsImpl,
    addMagicPlaceInteractivities: addMagicPlaceInteractivitiesImpl,
    clearMagicPlaceInteractivities: clearMagicPlaceInteractivitiesImpl,
    addMagicIdleInteractivities: addMagicIdleInteractivitiesImpl,
    clearMagicIdleInteractivities: clearMagicIdleInteractivitiesImpl,
    removeMagic: removeMagicImpl,

    // 墓地相关`Reducer`
    initCemetery: initCemeteryImpl,

    // 除外区相关`Reducer`
    initExclusion: initExclusionImpl,

    // 卡组相关`Reducer`
    initDeck: initDeckImpl,

    // 场地区相关`Reducer`
    initField: initFieldImpl,
    clearFieldPlaceInteractivities: clearFieldPlaceInteractivitiesImpl,
    addFieldPlaceInteractivities: addFieldPlaceInteractivitiesImpl,
    addFieldIdleInteractivities: addFieldIdleInteractivitiesImpl,
    clearFieldIdleInteractivities: clearFieldIdleInteractivitiesImpl,

    // 阶段相关
    updatePhase: newPhaseImpl,
    setEnableBp: setEnableBpImpl,
    setEnableEp: setEnableEpImpl,

    // UI相关`Reducer`
    setCardModalIsOpen: setCardModalIsOpenImpl,
    setCardModalText: setCardModalTextImpl,
    setCardModalImgUrl: setCardModalImgUrlImpl,
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
  },
  extraReducers(builder) {
    handsCase(builder);
    hintCase(builder);
    monsterCase(builder);
    magicCase(builder);
    cemeteryCase(builder);
    exclusionCase(builder);
    checkCardModalCase(builder);
    YesNoModalCase(builder);
    optionModalCase(builder);
  },
});

export const {
  setSelfType,
  infoInit,
  updateTurn,
  updatePhase,
  setEnableBp,
  setEnableEp,
  clearHandsIdleInteractivity,
  addHandsIdleInteractivity,
  updateTimeLimit,
  setCardModalIsOpen,
  setCardModalText,
  setCardModalImgUrl,
  setCardModalInteractivies,
  initMonsters,
  addMonsterPlaceInteractivities,
  clearMonsterPlaceInteractivities,
  addMonsterIdleInteractivities,
  clearMonsterIdleInteractivities,
  removeMonster,
  initMagics,
  addMagicPlaceInteractivities,
  clearMagicPlaceInteractivities,
  addMagicIdleInteractivities,
  clearMagicIdleInteractivities,
  removeMagic,
  removeHand,
  initCemetery,
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
  initExclusion,
  initField,
  clearFieldPlaceInteractivities,
  addFieldPlaceInteractivities,
  addFieldIdleInteractivities,
  clearFieldIdleInteractivities,
} = duelSlice.actions;
export const selectDuelHsStart = (state: RootState) => {
  return state.duel.meInitInfo != null;
};
export default duelSlice.reducer;
