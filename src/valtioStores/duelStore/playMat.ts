import { proxy } from "valtio";

import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { fetchCard } from "@/api/cards";
import type {
  PlayMatState,
  DuelFieldState,
  CardsBothSide,
  BothSide,
  InitInfo,
} from "./types";

/**
 * 生成一个指定长度的卡片数组
 */
function genBlock(location: ygopro.CardZone, n: number = 5) {
  return {
    me: Array(n)
      .fill(null)
      .map((_) => ({
        location: {
          location,
        },
        idleInteractivities: [],
        counters: {},
      })),
    op: Array(n)
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

const initInfo: PlayMatState["initInfo"] = proxy({
  me: {
    masterRule: "UNKNOWN",
    life: -1, // 特地设置一个不可能的值
    deckSize: 0,
    extraSize: 0,
  },
  op: {
    masterRule: "UNKNOWN",
    life: -1, // 特地设置一个不可能的值
    deckSize: 0,
    extraSize: 0,
  },
  set: (controller: number, obj: Partial<InitInfo>) => {
    initInfo[getWhom(controller)] = {
      ...initInfo[getWhom(controller)],
      ...obj,
    };
  },
});

/**
 *  给 `{me: [...], op: [...]}` 这种类型的对象添加一些方法
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
      res[getWhom(controller)].splice(sequence, 1);
    },
    insert: async (controller: number, sequence: number, id: number) => {
      const card = await genCard(controller, id);
      res[getWhom(controller)].splice(sequence, 0, card);
    },
    add: async (controller: number, ids: number[]) => {
      const cards = await Promise.all(
        ids.map(async (id) => genCard(controller, id))
      );
      res[getWhom(controller)].splice(
        res[getWhom(controller)].length,
        0,
        ...cards
      );
    },
  });
  return res;
};

export const playMat = proxy<PlayMatState>({
  magics: wrap(genBlock(ygopro.CardZone.SZONE), ygopro.CardZone.SZONE),
  monsters: wrap(genBlock(ygopro.CardZone.MZONE), ygopro.CardZone.MZONE),
  graveyard: wrap({ me: [], op: [] }, ygopro.CardZone.GRAVE),
  banishedZone: wrap({ me: [], op: [] }, ygopro.CardZone.REMOVED),
  hands: wrap({ me: [], op: [] }, ygopro.CardZone.HAND),
  deck: wrap({ me: [], op: [] }, ygopro.CardZone.DECK),
  extraDeck: wrap({ me: [], op: [] }, ygopro.CardZone.EXTRA),

  initInfo,
  timeLimit: {
    me: 0,
    op: 0,
  },

  selfType: ygopro.StocTypeChange.SelfType.UNKNOWN,
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

const getWhom = (controller: number) =>
  judgeSelf(controller, playMat.selfType) ? "me" : "op";

export function judgeSelf(player: number, selfType: number): boolean {
  switch (selfType) {
    case 1:
      // 自己是先攻
      return player === 0;
    case 2:
      // 自己是后攻
      return player === 1;
    default:
      // 目前不可能出现这种情况
      console.error("judgeSelf error", player, selfType);
      return false;
  }
}
