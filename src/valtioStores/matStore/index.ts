import { proxy } from "valtio";

import { fetchCard } from "@/api/cards";
import { ygopro } from "@/api/ocgcore/idl/ocgcore";

import type {
  BothSide,
  CardsBothSide,
  DuelFieldState,
  InitInfo,
  PlayMatState,
} from "./types";
import { DESCRIPTION_LIMIT, fetchStrings, getStrings } from "@/api/strings";

/**
 * 生成一个指定长度的卡片数组
 */
const genBlock = (
  location: ygopro.CardZone,
  n: number = 5
): BothSide<DuelFieldState> => {
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
};

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

const hint: PlayMatState["hint"] = proxy({
  code: -1,
  fetchCommonHintMeta: (hintData: number) => {
    return fetchStrings("!system", hintData);
  },
  fetchSelectHintMeta: async (selectHintData: number, esHint?: string) => {
    let selectHintMeta = "";
    if (selectHintData > DESCRIPTION_LIMIT) {
      // 针对`MSG_SELECT_PLACE`的特化逻辑
      const cardMeta = await fetchCard(selectHintData, true);
      selectHintMeta = fetchStrings("!system", 569).replace(
        "[%ls]",
        cardMeta.text.name || "[?]"
      );
    } else {
      selectHintMeta = await getStrings(selectHintData);
    }
    return {
      selectHintMeta,
      esHint,
    };
  },
  fetchEsHintMeta: async (
    _originMsg: string | number,
    location?: ygopro.CardLocation,
    cardID?: number
  ) => {
    const originMsg =
      typeof _originMsg === "string"
        ? _originMsg
        : fetchStrings("!system", _originMsg);

    if (cardID) {
      const cardMeta = await fetchCard(cardID);

      return { originMsg, cardMeta, location };
    } else {
      return { originMsg, location };
    }
  },
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
    setOccupant: async (
      controller: number,
      sequence: number,
      id: number,
      position?: ygopro.CardPosition
    ) => {
      const meta = await fetchCard(id);
      const target = res[getWhom(controller)][sequence];
      target.occupant = meta;
      if (position) {
        target.location.position = position;
      }
    },
    removeOccupant: (controller: number, sequence: number) => {
      res[getWhom(controller)][sequence].occupant = undefined;
    },
  });
  return res;
};

/**
 * 💡 决斗盘状态仓库，本文件核心，
 * 具体介绍可以点进`PlayMatState`去看
 */
export const matStore = proxy<PlayMatState>({
  magics: wrap(genBlock(ygopro.CardZone.SZONE), ygopro.CardZone.SZONE),
  monsters: wrap(genBlock(ygopro.CardZone.MZONE), ygopro.CardZone.MZONE),
  graveyards: wrap({ me: [], op: [] }, ygopro.CardZone.GRAVE),
  banishedZones: wrap({ me: [], op: [] }, ygopro.CardZone.REMOVED),
  hands: wrap({ me: [], op: [] }, ygopro.CardZone.HAND),
  decks: wrap({ me: [], op: [] }, ygopro.CardZone.DECK),
  extraDecks: wrap({ me: [], op: [] }, ygopro.CardZone.EXTRA),

  timeLimits: {
    // 时间限制
    me: 0,
    op: 0,
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
});

/**
 * 根据controller判断是自己还是对方
 * 不要往外export，尽量逻辑收拢在store内部
 */
const getWhom = (controller: number) =>
  judgeSelf(controller, matStore.selfType) ? "me" : "op";

function judgeSelf(player: number, selfType: number): boolean {
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
