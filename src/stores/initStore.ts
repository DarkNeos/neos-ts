import { proxy } from "valtio";

import { type NeosStore } from "./shared";

export const initStore = proxy({
  sqlite: {
    progress: 0, // 0 -> 1
  },
  decks: false,
  i18n: false,
  wasm: false,
  // ...
  reset() {},
} satisfies NeosStore);
