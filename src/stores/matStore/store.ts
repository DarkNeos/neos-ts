/* eslint valtio/avoid-this-in-proxy: 0 */
import { proxy, ref } from "valtio";

import { ygopro } from "@/api";

import { ActiveActionProcess } from "../activeActionProcess";
import type { CardType } from "../cardStore";
import { registerDuelDialogReset } from "../duelDialogs";
import { type NeosStore } from "../shared";
import { remainingTime } from "./clock";
import { ChainSetting, InitInfo, MatState } from "./types";

/**
 * 根据controller判断是自己还是对方。
 * 这个无需export，尽量逻辑收拢在store内部。
 */
const getWhom = (controller: number): "me" | "op" =>
  isMe(controller) ? "me" : "op";

/**
 * 根据自己的先后手判断是否是自己
 * 原本名字叫judgeSelf
 */
export const isMe = (controller: number): boolean => {
  // FIXME: all of the `matStore` need to access with container
  switch (matStore.selfType) {
    case 1:
      // 自己是先攻
      return controller === 0;
    case 2:
      // 自己是后攻
      return controller === 1;
    default:
      // 自己是观战者
      // 这里假设偶数方的玩家是自己
      return controller % 2 === 0;
  }
};

const defaultInitInfo = {
  masterRule: "UNKNOWN",
  name: "?",
  life: -1, // 特地设置一个不可能的值
  deckSize: 0,
  extraSize: 0,
};

const initInfo: MatState["initInfo"] = proxy({
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

const initialState: Omit<MatState, "reset" | "clearPhaseCommands"> = {
  chains: [],
  chainCards: [],
  playerHints: {},
  timeLimits: {
    activePlayer: null,
    receivedAt: 0,
    limit: 0,
    // 时间限制
    me: -1,
    op: -1,
    of: (controller: number) => matStore.timeLimits[getWhom(controller)],
    set: (controller: number, time: number) => {
      matStore.stopClock();
      matStore.timeLimits[getWhom(controller)] = Math.max(0, time);
      matStore.timeLimits.limit = Math.max(matStore.timeLimits.limit, time);
      matStore.timeLimits.activePlayer = controller;
      matStore.timeLimits.receivedAt = Date.now();
    },
  },
  stopClock: () => {
    const clock = matStore.timeLimits;
    if (clock.activePlayer === null) return;
    const who = getWhom(clock.activePlayer);
    clock[who] = remainingTime(clock[who], clock.receivedAt, Date.now());
    clock.activePlayer = null;
  },
  initInfo,
  selfType: ygopro.StocTypeChange.SelfType.UNKNOWN,
  hint: { code: -1 },
  currentPlayer: -1,
  phase: {
    currentPhase: ygopro.StocGameMessage.MsgNewPhase.PhaseType.UNKNOWN,
    command: null,
    enableBp: false, // 允许进入战斗阶段
    enableM2: false, // 允许进入M2阶段
    enableEp: false, // 允许回合结束
  },
  unimplemented: 0,
  handResults: {
    me: 0,
    op: 0,
    of: (controller: number) => matStore.handResults[getWhom(controller)],
    set(controller, result) {
      matStore.handResults[getWhom(controller)] = result;
    },
  },
  tossResult: undefined,
  chainSetting: ChainSetting.CHAIN_SMART,
  deckReserved: false,
  duelEnd: false,
  // methods
  isMe,
  turnCount: 0,
  error: "",
};

export class MatStore implements MatState, NeosStore {
  readonly activeActions = ref(new ActiveActionProcess<CardType>());
  stopClock = initialState.stopClock;
  chains = initialState.chains;
  chainCards: MatState["chainCards"] = [];
  playerHints: MatState["playerHints"] = {};
  chainSetting = initialState.chainSetting;
  deckReserved = initialState.deckReserved;
  timeLimits = initialState.timeLimits;
  initInfo = initialState.initInfo;
  selfType = initialState.selfType;
  hint = initialState.hint;
  currentPlayer = initialState.currentPlayer;
  phase = initialState.phase;
  unimplemented = initialState.unimplemented;
  handResults = initialState.handResults;
  tossResult = initialState.tossResult;
  duelEnd = initialState.duelEnd;
  turnCount = initialState.turnCount;
  error = initialState.error;

  // methods
  isMe = initialState.isMe;
  /** 洗牌或身份隐藏后解除卡片绑定，保留连锁列表中的公开发动记录。 */
  clearChainBindings(uuids: readonly string[]): void {
    const hidden = new Set(uuids);
    for (const entry of this.chainCards) {
      if (entry.cardUuid && hidden.has(entry.cardUuid))
        entry.cardUuid = undefined;
      entry.targets = entry.targets?.filter((uuid) => !hidden.has(uuid));
    }
  }
  clearPhaseCommands(): void {
    this.activeActions.reset();
    this.phase.command = null;
    this.phase.enableBp = false;
    this.phase.enableM2 = false;
    this.phase.enableEp = false;
  }
  reset(): void {
    this.activeActions.reset();
    this.chains = [];
    this.chainCards = [];
    this.playerHints = {};
    this.deckReserved = false;
    this.timeLimits.me = -1;
    this.timeLimits.op = -1;
    this.timeLimits.activePlayer = null;
    this.timeLimits.receivedAt = 0;
    this.timeLimits.limit = 0;
    this.initInfo.me = defaultInitInfo;
    this.initInfo.op = defaultInitInfo;
    this.selfType = ygopro.StocTypeChange.SelfType.UNKNOWN;
    this.hint = { code: -1 };
    this.currentPlayer = -1;
    this.phase = {
      currentPhase: ygopro.StocGameMessage.MsgNewPhase.PhaseType.UNKNOWN,
      command: null,
      enableBp: false, // 允许进入战斗阶段
      enableM2: false, // 允许进入M2阶段
      enableEp: false, // 允许回合结束
    };
    this.unimplemented = 0;
    this.handResults.me = 0;
    this.handResults.op = 0;
    this.tossResult = undefined;
    this.duelEnd = false;
    this.turnCount = 0;
    this.error = initialState.error;
  }
}

/**
 * 💡 决斗盘状态仓库，本文件核心，
 * 具体介绍可以点进`MatState`去看
 */
export const matStore = proxy<MatStore>(new MatStore());
registerDuelDialogReset(() => {
  matStore.clearPhaseCommands();
  matStore.chainCards = [];
  matStore.playerHints = {};
  matStore.hint.zones = [];
});

// @ts-ignore 挂到全局，便于调试
window.matStore = matStore;
