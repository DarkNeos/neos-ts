import { proxy } from "valtio";

import { type NeosStore } from "./shared";

export const initStore = proxy({
  sqlite: {
    progress: 0, // 0 -> 1
  }, // ygodb
  decks: false,
  i18n: false,
  forbidden: false, // 禁卡表
  superprerelease: false, // 超先行
  // ...
  reset() {},
} satisfies NeosStore);
