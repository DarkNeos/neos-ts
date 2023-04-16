import { proxy } from "valtio";

import { ygopro } from "@/api/ocgcore/idl/ocgcore";

import type { DuelState } from "./types";

/**
 * 生成一个指定长度的卡片数组
 */
function genDuelFieldState(location: ygopro.CardZone, n: number = 5) {
  return {
    inner: Array(n)
      .fill(null)
      .map((_) => ({
        location: {
          location,
        },
        idleInteractivities: [],
        counters: {},
      })),
  };
}

export const playMat = proxy<DuelState>({
  opMagics: genDuelFieldState(ygopro.CardZone.SZONE),
  meMagics: genDuelFieldState(ygopro.CardZone.SZONE),
  opMonsters: genDuelFieldState(ygopro.CardZone.MZONE),
  meMonsters: genDuelFieldState(ygopro.CardZone.MZONE),
  opGraveyard: { inner: [] },
  meGraveyard: { inner: [] },
  opBanishedZone: { inner: [] },
  meBanishedZone: { inner: [] },
  opHands: { inner: [] },
  meHands: { inner: [] },
  opDeck: { inner: [] },
  meDeck: { inner: [] },
  opExtraDeck: { inner: [] },
  meExtraDeck: { inner: [] },
});
