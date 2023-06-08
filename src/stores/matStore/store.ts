/* eslint valtio/avoid-this-in-proxy: 0 */
import { proxy } from "valtio";

import { ygopro } from "@/api";

import type { InitInfo, MatState } from "./types";

import SelfType = ygopro.StocTypeChange.SelfType;

/**
 * 根据controller判断是自己还是对方。
 * 这个无需export，尽量逻辑收拢在store内部。
 */
const getWhom = (controller: number): "me" | "op" =>
  isMe(controller) ? "me" : "op";

/**
 * 根据自己的先后手判断是否是自己
 */
export const isMe = (controller: number): boolean => {
  switch (matStore.selfType) {
    case 1:
      // 自己是先攻
      return controller === 0;
    case 2:
      // 自己是后攻
      return controller === 1;
    default:
      // 目前不可能出现这种情况
      console.error("judgeSelf error", controller, matStore.selfType);
      return false;
  }
};

const initInfo: MatState["initInfo"] = (() => {
  const defaultInitInfo = {
    masterRule: "UNKNOWN",
    name: "?",
    life: -1, // 特地设置一个不可能的值
    deckSize: 0,
    extraSize: 0,
  };
  return proxy({
    me: { ...defaultInitInfo },
    op: { ...defaultInitInfo },
    of: (controller: number) => initInfo[getWhom(controller)],
    set: (controller: number, obj: Partial<InitInfo>) => {
      initInfo[getWhom(controller)] = {
        ...initInfo[getWhom(controller)],
        ...obj,
      };
    },
  });
})();

/**
 * 💡 决斗盘状态仓库，本文件核心，
 * 具体介绍可以点进`MatState`去看
 */
export const matStore: MatState = proxy<MatState>({
  chains: [],

  timeLimits: {
    // 时间限制
    me: -1,
    op: -1,
    of: (controller: number) => matStore.timeLimits[getWhom(controller)],
    set: (controller: number, time: number) => {
      matStore.timeLimits[getWhom(controller)] = time;
    },
  },

  initInfo,

  selfType: ygopro.StocTypeChange.SelfType.UNKNOWN,
  hint: { code: -1 },
  currentPlayer: -1,
  phase: {
    currentPhase: ygopro.StocGameMessage.MsgNewPhase.PhaseType.UNKNOWN, // TODO 当前的阶段 应该改成enum
    enableBp: false, // 允许进入战斗阶段
    enableM2: false, // 允许进入M2阶段
    enableEp: false, // 允许回合结束
  },
  result: ygopro.StocGameMessage.MsgWin.ActionType.UNKNOWN,
  waiting: false,
  unimplemented: 0,

  // 从playerStore搬过来的
  player: {
    0: {},
    1: {},
    me: () =>
      matStore.selfType === SelfType.PLAYER1
        ? matStore.player[0]
        : matStore.player[1],
    op: () =>
      matStore.selfType === SelfType.PLAYER1
        ? matStore.player[1]
        : matStore.player[0],
  },
  observerCount: 0,
  isHost: false,

  // methods
  isMe,
});

// @ts-ignore 挂到全局，便于调试
window.matStore = matStore;
