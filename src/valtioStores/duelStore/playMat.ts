import { proxy } from "valtio";

import { ygopro } from "@/api/ocgcore/idl/ocgcore";

import type { PlayMatState } from "./types";

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

export const playMat = proxy<PlayMatState>({
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

  selfType: ygopro.StocTypeChange.SelfType.UNKNOWN,

  meInitInfo: {
    masterRule: "UNKNOWN",
    life: 7999, // 特地设置一个不可能的值
    deckSize: 0,
    extraSize: 0,
  },
  opInitInfo: {
    masterRule: "",
    life: 7999, // 特地设置一个不可能的值
    deckSize: 0,
    extraSize: 0,
  },
  hint: {
    code: -1,
  },
  currentPlayer: -1,
  phase: {
    currentPhase: "UNKNOWN", // TODO 当前的阶段 应该改成enum
    enableBp: false, // 允许进入战斗阶段
    enableM2: false, // 允许进入M2阶段
    enableEp: false, // 允许回合结束
  },
  result: ygopro.StocGameMessage.MsgWin.ActionType.UNKNOWN,
  waiting: false,
  unimplemented: 0,
});
