import { proxy } from "valtio";
import type { ModalState } from "./types";

export const messageStore = proxy<ModalState>({
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
});

// >>> modal types >>>
