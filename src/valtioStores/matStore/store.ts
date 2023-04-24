import { cloneDeep } from "lodash-es";
import { proxy } from "valtio";

import { ygopro } from "@/api";
import { fetchCard } from "@/api/cards";

import type {
  BothSide,
  CardState,
  DuelFieldState,
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

const genDuel = <T extends {}>(meObj: T, opObj?: T): BothSide<T> => {
  // 提供opObj是为了让meObj和opObj的类型可以不同，避免深拷贝的坑...
  const res = proxy({
    me: Object.assign(meObj, {
      getController: () => (matStore.selfType == 1 ? 0 : 1),
    }),
    op: Object.assign(opObj ?? meObj, {
      getController: () => (matStore.selfType == 1 ? 0 : 1),
    }),
    of: (controller: number) => res[getWhom(controller)],
  });
  return res;
};

const addMethods = <T extends CardState[]>(
  entity: T,
  zone: ygopro.CardZone
): DuelFieldState => {
  /** 生成一个卡片，根据`id`获取卡片信息 */
  const genCard = async (controller: number, id: number) => ({
    occupant: await fetchCard(id, true),
    location: {
      controler: controller,
      location: zone,
    },
    counters: {},
    idleInteractivities: [],
  });

  const res = proxy(entity) as unknown as DuelFieldState;
  res.remove = (sequence: number) => {
    res.splice(sequence, 1);
  };
  res.insert = async (sequence: number, id: number) => {
    const card = await genCard(res.getController(), id);
    res.splice(sequence, 0, card);
  };
  res.add = async (ids: number[]) => {
    const cards = await Promise.all(
      ids.map(async (id) => genCard(res.getController(), id))
    );
    res.splice(res.length, 0, ...cards);
  };
  res.setOccupant = async (
    sequence: number,
    id: number,
    position?: ygopro.CardPosition
  ) => {
    const meta = await fetchCard(id);
    const target = res[sequence];
    target.occupant = meta;
    if (position) {
      target.location.position = position;
    }
  };

  res.addIdleInteractivity = (
    sequence: number,
    interactivity: CardState["idleInteractivities"][number]
  ) => {
    res[sequence].idleInteractivities.push(interactivity);
  };
  res.clearIdleInteractivities = () => {
    res.forEach((card) => (card.idleInteractivities = []));
  };
  res.setPlaceInteractivityType = (
    sequence: number,
    interactType: InteractType
  ) => {
    res[sequence].placeInteractivity = {
      interactType: interactType,
      response: {
        controler: res.getController(),
        zone,
        sequence,
      },
    };
  };
  res.clearPlaceInteractivity = () => {
    res.forEach((card) => (card.placeInteractivity = undefined));
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
  ...genDuel({
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
  magics: genDuel(
    addMethods(genBlock(SZONE, 6), SZONE),
    addMethods(genBlock(SZONE, 6), SZONE)
  ),
  monsters: genDuel(
    addMethods(genBlock(MZONE, 7), MZONE),
    addMethods(genBlock(MZONE, 7), MZONE)
  ),
  graveyards: genDuel(addMethods([], GRAVE), addMethods([], GRAVE)),
  banishedZones: genDuel(addMethods([], REMOVED), addMethods([], REMOVED)),
  hands: genDuel(addMethods([], HAND), addMethods([], HAND)),
  decks: genDuel(addMethods([], DECK), addMethods([], DECK)),
  extraDecks: genDuel(addMethods([], EXTRA), addMethods([], EXTRA)),

  timeLimits: {
    // 时间限制
    ...genDuel(-1),
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

// @ts-ignore
window.matStore = matStore;
