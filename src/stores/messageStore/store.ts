import { proxy } from "valtio";

import type { ModalState } from "./types";

export const messageStore = proxy<ModalState>({
  announceModal: {
    isOpen: false,
    min: 1,
    options: [],
  },
});

// >>> modal types >>>
