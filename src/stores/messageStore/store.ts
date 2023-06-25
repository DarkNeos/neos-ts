import { proxy } from "valtio";

import type { ModalState } from "./types";

export const messageStore = proxy<ModalState>({
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
