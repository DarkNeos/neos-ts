import { proxy } from "valtio";

import type { ModalState } from "./types";

export const messageStore = proxy<ModalState>({
  cardModal: { isOpen: false, interactivies: [], counters: {} },
  cardListModal: { isOpen: false, list: [] },
  selectCardActions: {
    isOpen: false,
    isValid: false,
    cancelAble: false,
    finishAble: false,
    selecteds: [],
    selectables: [],
    mustSelects: [],
  },
  yesNoModal: { isOpen: false },
  positionModal: { isOpen: false, positions: [] },
  checkCounterModal: {
    isOpen: false,
    options: [],
  },
  sortCardModal: {
    isOpen: false,
    options: [],
  },
  announceModal: {
    isOpen: false,
    min: 1,
    options: [],
  },
});

// >>> modal types >>>
