import { cloneDeep } from "lodash-es";
import { v4 as v4uuid } from "uuid";
import { proxy } from "valtio";

import { ygopro } from "@/api";
import { fetchCard } from "@/api/cards";

import type {
  CardState,
  DuelFieldState as ArrayCardState,
  InitInfo,
  MatState,
} from "./types";
import { InteractType } from "./types";

/**
 * 根据controller判断是自己还是对方。
 * 这个无需export，尽量逻辑收拢在store内部。
 */
const getWhom = (controller: number): "me" | "op" =>
  isMe(controller) ? "me" : "op";

/** 卡的列表，提供了一些方便的方法 */
class CardArray extends Array<CardState> implements ArrayCardState {
  public __proto__ = CardArray.prototype;
  public zone: ygopro.CardZone = ygopro.CardZone.MZONE;
  public getController: () => number = () => 1;
  private genCard = async (
    uuid: string,
    controller: number,
    id: number,
    position?: ygopro.CardPosition
  ) => ({
    uuid,
    occupant: await fetchCard(id, true),
    location: {
      controler: controller,
      zone: this.zone,
      position:
        position == undefined ? ygopro.CardPosition.FACEUP_ATTACK : position,
    },
    counters: {},
    idleInteractivities: [],
  });
  // methods
  remove(sequence: number) {
    return this.splice(sequence, 1)[0];
  }
  async insert(
    uuid: string,
    id: number,
    sequence: number,
    position?: ygopro.CardPosition
  ) {
    const card = await this.genCard(uuid, this.getController(), id, position);
    this.splice(sequence, 0, card);
  }
  async add(
    data: { uuid: string; id: number }[],
    position?: ygopro.CardPosition
  ) {
    const cards = await Promise.all(
      data.map(async ({ uuid, id }) =>
        this.genCard(uuid, this.getController(), id, position)
      )
    );
    this.splice(this.length, 0, ...cards);
  }
  async setOccupant(
    sequence: number,
    id: number,
    position?: ygopro.CardPosition
  ) {
    const meta = await fetchCard(id);
    const target = this[sequence];
    target.occupant = meta;
    if (position) {
      target.location.position = position;
    }
  }
  addIdleInteractivity(
    sequence: number,
    interactivity: CardState["idleInteractivities"][number]
  ) {
    this[sequence].idleInteractivities.push(interactivity);
  }
  clearIdleInteractivities() {
    this.forEach((card) => (card.idleInteractivities = []));
  }
  setPlaceInteractivityType(sequence: number, interactType: InteractType) {
    this[sequence].placeInteractivity = {
      interactType: interactType,
      response: {
        controler: this.getController(),
        zone: this.zone,
        sequence,
      },
    };
  }
  clearPlaceInteractivity() {
    this.forEach((card) => (card.placeInteractivity = undefined));
  }
}

const genDuelCardArray = (cardStates: CardState[], zone: ygopro.CardZone) => {
  // 为什么不放在构造函数里面，是因为不想改造继承自Array的构造函数
  const me = cloneDeep(new CardArray(...cardStates));
  me.zone = zone;
  me.getController = () => (matStore.selfType === 1 ? 0 : 1);
  const op = cloneDeep(new CardArray(...cardStates));
  op.zone = zone;
  op.getController = () => (matStore.selfType === 1 ? 1 : 0);
  const res = proxy({
    me,
    op,
    of: (controller: number) => res[getWhom(controller)],
  });
  return res;
};

/**
 * 根据自己的先后手判断是否是自己
 * 原本名字叫judgeSelf
 */
const isMe = (controller: number): boolean => {
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

/**
 * 生成一个指定长度的卡片数组
 */
const genBlock = (zone: ygopro.CardZone, n: number) =>
  Array(n)
    .fill(null)
    .map((_) => ({
      uuid: v4uuid(), // WARN: 这里其实应该不分配UUID
      location: {
        zone,
      },
      idleInteractivities: [],
      counters: {},
    }));

const initInfo: MatState["initInfo"] = (() => {
  const defaultInitInfo = {
    masterRule: "UNKNOWN",
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

const hint: MatState["hint"] = proxy({
  code: -1,
});

/**
 * zone -> matStore
 */
const getZone = (zone: ygopro.CardZone) => {
  switch (zone) {
    case ygopro.CardZone.MZONE:
      return matStore.monsters;
    case ygopro.CardZone.SZONE:
      return matStore.magics;
    case ygopro.CardZone.HAND:
      return matStore.hands;
    case ygopro.CardZone.DECK:
      return matStore.decks;
    case ygopro.CardZone.GRAVE:
      return matStore.graveyards;
    case ygopro.CardZone.REMOVED:
      return matStore.banishedZones;
    case ygopro.CardZone.EXTRA:
      return matStore.extraDecks;
    default:
      console.error("in error", zone);
      return matStore.extraDecks;
  }
};

const { SZONE, MZONE, GRAVE, REMOVED, HAND, DECK, EXTRA } = ygopro.CardZone;

/**
 * 💡 决斗盘状态仓库，本文件核心，
 * 具体介绍可以点进`MatState`去看
 */
export const matStore: MatState = proxy<MatState>({
  magics: genDuelCardArray(genBlock(SZONE, 6), SZONE),
  monsters: genDuelCardArray(genBlock(MZONE, 7), MZONE),
  graveyards: genDuelCardArray([], GRAVE),
  banishedZones: genDuelCardArray([], REMOVED),
  hands: genDuelCardArray([], HAND),
  decks: genDuelCardArray([], DECK),
  extraDecks: genDuelCardArray([], EXTRA),

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
  hint,
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
  // methods
  in: getZone,
  isMe,
});

// @ts-ignore 挂到全局，便于调试
window.matStore = matStore;

// 修改原型链，因为valtio的proxy会把原型链改掉。这应该是valtio的一个bug...有空提issue去改
(["me", "op"] as const).forEach((who) => {
  (
    [
      "hands",
      "decks",
      "extraDecks",
      "graveyards",
      "banishedZones",
      "monsters",
      "magics",
    ] as const
  ).forEach((zone) => {
    matStore[zone][who].__proto__ = CardArray.prototype;
  });
});
