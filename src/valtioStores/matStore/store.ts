import { cloneDeep } from "lodash-es";
import { proxy } from "valtio";

import { ygopro } from "@/api";
import { fetchCard } from "@/api/cards";

import type {
  BothSide,
  CardsBothSide,
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
 */
const isMe = (player: number): boolean => {
  switch (matStore.selfType) {
    case 1:
      // 自己是先攻
      return player === 0;
    case 2:
      // 自己是后攻
      return player === 1;
    default:
      // 目前不可能出现这种情况
      console.error("judgeSelf error", player, matStore.selfType);
      return false;
  }
};

const genDuel = <T>(obj: T): BothSide<T> => {
  const res = proxy({
    me: cloneDeep(obj),
    op: cloneDeep(obj),
    of: (controller: number) => res[getWhom(controller)],
  });
  return res;
};

/**
 * 生成一个指定长度的卡片数组
 */
const genBlock = (location: ygopro.CardZone, n: number): DuelFieldState =>
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
 * 在决斗盘仓库之中，
 * 给 `{me: [...], op: [...]}` 这种类型的对象添加一些方法。
 * 具体的方法可以看`CardsBothSide`的类型定义
 */
const wrap = <T extends DuelFieldState>(
  entity: BothSide<T>,
  zone: ygopro.CardZone
): CardsBothSide<T> => {
  /**
   * 生成一个卡片，根据`id`获取卡片信息
   */
  const genCard = async (controller: number, id: number) => ({
    occupant: await fetchCard(id, true),
    location: {
      controler: controller,
      location: zone,
    },
    counters: {},
    idleInteractivities: [],
  });

  const res: CardsBothSide<T> = proxy({
    ...entity,
    remove: (controller: number, sequence: number) => {
      res.of(controller).splice(sequence, 1);
    },
    insert: async (controller: number, sequence: number, id: number) => {
      const card = await genCard(controller, id);
      res.of(controller).splice(sequence, 0, card);
    },
    add: async (controller: number, ids: number[]) => {
      const cards = await Promise.all(
        ids.map(async (id) => genCard(controller, id))
      );
      res.of(controller).splice(res.of(controller).length, 0, ...cards);
    },
    setOccupant: async (
      controller: number,
      sequence: number,
      id: number,
      position?: ygopro.CardPosition
    ) => {
      const meta = await fetchCard(id);
      const target = res.of(controller)[sequence];
      target.occupant = meta;
      if (position) {
        target.location.position = position;
      }
    },
    addIdleInteractivity: (
      controller: number,
      sequence: number,
      interactivity: CardState["idleInteractivities"][number]
    ) => {
      res.of(controller)[sequence].idleInteractivities.push(interactivity);
    },
    clearIdleInteractivities: (controller: number) => {
      res.of(controller).forEach((card) => (card.idleInteractivities = []));
    },
    setPlaceInteractivityType: (
      controller: number,
      sequence: number,
      interactType: InteractType
    ) => {
      res.of(controller)[sequence].placeInteractivity = {
        interactType: interactType,
        response: {
          controler: controller,
          zone,
          sequence,
        },
      };
    },
    clearPlaceInteractivity: (controller: number) => {
      res
        .of(controller)
        .forEach((card) => (card.placeInteractivity = undefined));
    },
  });
  return res;
};

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
  magics: wrap(genDuel(genBlock(SZONE, 6)), SZONE),
  monsters: wrap(genDuel(genBlock(MZONE, 7)), MZONE),
  graveyards: wrap(genDuel([]), GRAVE),
  banishedZones: wrap(genDuel([]), REMOVED),
  hands: wrap(genDuel([]), HAND),
  decks: wrap(genDuel([]), DECK),
  extraDecks: wrap(genDuel([]), EXTRA),

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
