export * from "./types";

import { proxy } from "valtio";

import { fetchCard, type CardMeta } from "@/api/cards";
import { ygopro } from "@/api/ocgcore/idl/ocgcore";

import type {
  BothSide,
  CardState,
  CardsBothSide,
  DuelFieldState,
  InitInfo,
  MatState,
} from "./types";
import { InteractType } from "./types";
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

const initInfo: MatState["initInfo"] = proxy({
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

const hint: MatState["hint"] = proxy({
  code: -1,
  fetchCommonHintMeta: (code: number) => {
    hint.code = code;
    hint.msg = fetchStrings("!system", code);
  },
  fetchSelectHintMeta: async ({ selectHintData, esHint }) => {
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

    hint.code = selectHintData;
    if (hint.code > DESCRIPTION_LIMIT) {
      // 针对`MSG_SELECT_PLACE`的特化逻辑
      hint.msg = selectHintMeta;
    } else {
      hint.esSelectHint = selectHintMeta;
      hint.esHint = esHint;
    }
  },
  fetchEsHintMeta: async ({ originMsg, location, cardID }) => {
    const newOriginMsg =
      typeof originMsg === "string"
        ? originMsg
        : fetchStrings("!system", originMsg);

    const cardMeta = cardID ? await fetchCard(cardID) : undefined;

    let esHint = newOriginMsg;

    if (cardMeta?.text.name) {
      esHint = esHint.replace("[?]", cardMeta.text.name);
    }

    if (location) {
      const fieldMeta = matStore
        .getZone(location.location)
        .at(location.controler)
        .at(location.sequence);
      if (fieldMeta?.occupant?.text.name) {
        esHint = esHint.replace("[?]", fieldMeta.occupant.text.name);
      }
    }

    hint.esHint = esHint;
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
    at: (controller: number) => {
      return res[getWhom(controller)];
    },
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
    addIdleInteractivity: (
      controller: number,
      sequence: number,
      interactivity: CardState["idleInteractivities"][number]
    ) => {
      res[getWhom(controller)][sequence].idleInteractivities.push(
        interactivity
      );
    },
    clearIdleInteractivities: (controller: number, sequence: number) => {
      res[getWhom(controller)][sequence].idleInteractivities = [];
    },
    setPlaceInteractivityType: (
      controller: number,
      sequence: number,
      interactType: InteractType
    ) => {
      res[getWhom(controller)][sequence].placeInteractivity = {
        interactType: interactType,
        response: {
          controler: controller,
          zone,
          sequence,
        },
      };
    },
    clearPlaceInteractivity: (controller: number, sequence: number) => {
      res[getWhom(controller)][sequence].placeInteractivity = undefined;
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
/**
 * 💡 决斗盘状态仓库，本文件核心，
 * 具体介绍可以点进`PlayMatState`去看
 */
export const matStore: MatState = proxy<MatState>({
  magics: wrap(genBlock(ygopro.CardZone.SZONE, 6), ygopro.CardZone.SZONE),
  monsters: wrap(genBlock(ygopro.CardZone.MZONE, 7), ygopro.CardZone.MZONE),
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
  // methods
  getZone,
});

/**
 * 根据controller判断是自己还是对方
 * 不要往外export，尽量逻辑收拢在store内部
 */
const getWhom = (controller: number): "me" | "op" =>
  judgeSelf(controller, matStore.selfType) ? "me" : "op";

const judgeSelf = (player: number, selfType: number): boolean => {
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
};
