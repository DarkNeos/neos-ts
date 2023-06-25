import { proxy } from "valtio";

import type { ModalState } from "./types";

export const messageStore = proxy<ModalState>({
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
