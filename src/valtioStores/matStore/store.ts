import { cloneDeep } from "lodash-es";
import { proxy } from "valtio";

import { ygopro } from "@/api";
import { fetchCard } from "@/api/cards";

import type {
  BothSide,
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
  private genCard = async (controller: number, id: number) => ({
    occupant: await fetchCard(id, true),
    location: {
      controler: controller,
      location: this.zone,
    },
    counters: {},
    idleInteractivities: [],
  });
  /** 内部输出一些注释，等稳定了再移除这个log */
  private logInside(name: string, obj: Record<string, any>) {
    console.warn("matStore", name, {
      zone: ygopro.CardZone[this.zone],
      controller: getWhom(this.getController()),
      ...obj,
    });
  }
  // methods
  remove(sequence: number) {
    this.logInside("remove", { sequence });
    this.splice(sequence, 1);
  }
  async insert(sequence: number, id: number) {
    this.logInside("insert", { sequence, id });
    const card = await this.genCard(this.getController(), id);
    this.splice(sequence, 0, card);
  }
  async add(ids: number[]) {
    this.logInside("add", { ids });
    const cards = await Promise.all(
      ids.map(async (id) => this.genCard(this.getController(), id))
    );
    this.splice(this.length, 0, ...cards);
  }
  async setOccupant(
    sequence: number,
    id: number,
    position?: ygopro.CardPosition
  ) {
    this.logInside("setOccupant", { sequence, id, position });
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
    this.logInside("addIdleInteractivity", { sequence, interactivity });
    this[sequence].idleInteractivities.push(interactivity);
  }
  clearIdleInteractivities() {
    this.forEach((card) => (card.idleInteractivities = []));
  }
  setPlaceInteractivityType(sequence: number, interactType: InteractType) {
    this.logInside("setPlaceInteractivityType", { sequence, interactType });
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

const genDuelNormal = <T extends {}>(meObj: T): BothSide<T> => {
  // 提供opObj是为了让meObj和opObj的类型可以不同，避免深拷贝的坑...
  const res = {
    me: { ...meObj },
    op: { ...meObj },
    of: (controller: number) => res[getWhom(controller)],
  };
  return res;
};

/**
 * 生成一个指定长度的卡片数组
 */
const genBlock = (location: ygopro.CardZone, n: number) =>
  Array(n)
    .fill(null)
    .map((_) => ({
      location: {
        location,
      },
      idleInteractivities: [],
      counters: {},
    }));

const initInfo: MatState["initInfo"] = proxy({
  ...genDuelNormal({
    masterRule: "UNKNOWN",
    life: -1, // 特地设置一个不可能的值
    deckSize: 0,
    extraSize: 0,
  }),
  set: (controller: number, obj: Partial<InitInfo>) => {
    initInfo[getWhom(controller)] = {
      ...initInfo[getWhom(controller)],
      ...obj,
    };
  },
});

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
    ...genDuelNormal(-1),
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
    currentPhase: "UNKNOWN", // TODO 当前的阶段 应该改成enum
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

// 以后再来解决这些...

// @ts-ignore
window.matStore = matStore;

// 修改原型链，因为valtiol的proxy会把原型链改掉。这应该是valtio的一个bug...有空提issue去改
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
