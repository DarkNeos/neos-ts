import { ygopro } from "@/api";
import PhaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType;
import { CardMeta } from "@/api";
//! 一些Neos中基础的数据结构

// Position

export const FACEUP_ATTACK = 0x1;
export const FACEDOWN_ATTACK = 0x2;
export const FACEUP_DEFENSE = 0x4;
export const FACEDOWN_DEFENSE = 0x8;

// 类型
export const TYPE_MONSTER = 0x1; //
export const TYPE_SPELL = 0x2; //
export const TYPE_TRAP = 0x4; //
export const TYPE_NORMAL = 0x10; //
export const TYPE_EFFECT = 0x20; //
export const TYPE_FUSION = 0x40; //
export const TYPE_RITUAL = 0x80; //
export const TYPE_TRAPMONSTER = 0x100; //
export const TYPE_SPIRIT = 0x200; //
export const TYPE_UNION = 0x400; //
export const TYPE_DUAL = 0x800; //
export const TYPE_TUNER = 0x1000; //
export const TYPE_SYNCHRO = 0x2000; //
export const TYPE_TOKEN = 0x4000; //
export const TYPE_QUICKPLAY = 0x10000; //
export const TYPE_CONTINUOUS = 0x20000; //
export const TYPE_EQUIP = 0x40000; //
export const TYPE_FIELD = 0x80000; //
export const TYPE_COUNTER = 0x100000; //
export const TYPE_FLIP = 0x200000; //
export const TYPE_TOON = 0x400000; //
export const TYPE_XYZ = 0x800000; //
export const TYPE_PENDULUM = 0x1000000; //
export const TYPE_SPSUMMON = 0x2000000; //
export const TYPE_LINK = 0x4000000; //

/*
 * 在做卡牌信息展示的时候，发现`CardMeta`里面的数据和`strings.conf`配置文件
 * 里面的code是不对应的，这里定义一个哈希表来管理其中的映射关系。
 *
 * metaCode -> stringCode
 * */
export const Type2StringCodeMap: Map<number, number> = new Map([
  [TYPE_MONSTER, 1050],
  [TYPE_SPELL, 1051],
  [TYPE_TRAP, 1052],
  [TYPE_NORMAL, 1054],
  [TYPE_EFFECT, 1055],
  [TYPE_FUSION, 1056],
  [TYPE_RITUAL, 1057],
  [TYPE_TRAPMONSTER, 1058],
  [TYPE_SPIRIT, 1059],
  [TYPE_UNION, 1060],
  [TYPE_DUAL, 1061],
  [TYPE_TUNER, 1062],
  [TYPE_SYNCHRO, 1063],
  [TYPE_TOKEN, 1064],
  [TYPE_QUICKPLAY, 1066],
  [TYPE_CONTINUOUS, 1067],
  [TYPE_EQUIP, 1068],
  [TYPE_FIELD, 1069],
  [TYPE_COUNTER, 1070],
  [TYPE_FLIP, 1071],
  [TYPE_TOON, 1072],
  [TYPE_XYZ, 1073],
  [TYPE_PENDULUM, 1074],
  [TYPE_SPSUMMON, 1075],
  [TYPE_LINK, 1076],
]);

/*
 * ygopro将卡牌类型按位运算进行了编码，这里将编码信息提出出来*/
export function extraCardTypes(typeCode: number): number[] {
  return [
    TYPE_MONSTER,
    TYPE_SPELL,
    TYPE_TRAP,
    TYPE_NORMAL,
    TYPE_EFFECT,
    TYPE_FUSION,
    TYPE_RITUAL,
    TYPE_TRAPMONSTER,
    TYPE_SPIRIT,
    TYPE_UNION,
    TYPE_DUAL,
    TYPE_TUNER,
    TYPE_SYNCHRO,
    TYPE_TOKEN,
    TYPE_QUICKPLAY,
    TYPE_CONTINUOUS,
    TYPE_EQUIP,
    TYPE_FIELD,
    TYPE_COUNTER,
    TYPE_FLIP,
    TYPE_TOON,
    TYPE_XYZ,
    TYPE_PENDULUM,
    TYPE_SPSUMMON,
    TYPE_LINK,
  ].filter((target) => (target & typeCode) > 0);
}

/** 这张卡能不能放入额外卡组 */
export function isExtraDeckCard(typeCode: number): boolean {
  const extraTypes = [TYPE_LINK, TYPE_SYNCHRO, TYPE_XYZ, TYPE_FUSION];
  return extraTypes.reduce((acc, cur) => (acc | cur) & typeCode, 0) > 0;
}

/** 这张卡是怪兽、魔法、陷阱 */
export function tellCardBasicType(typeCode: number): number {
  const basicTypes = [TYPE_MONSTER, TYPE_SPELL, TYPE_TRAP];
  return basicTypes.reduce((acc, cur) => (acc | cur) & typeCode, 0);
}

/** 获取更加细分的分类 */
export function tellCardSecondaryType(typeCode: number): number {
  const secondaryType = [
    TYPE_NORMAL,
    TYPE_FUSION,
    TYPE_RITUAL,
    TYPE_SYNCHRO,
    TYPE_XYZ,
    TYPE_PENDULUM,
    TYPE_LINK,
    TYPE_QUICKPLAY,
    TYPE_CONTINUOUS,
    TYPE_EQUIP,
    TYPE_FIELD,
    TYPE_COUNTER,
  ];
  return secondaryType.reduce((acc, cur) => (acc | cur) & typeCode, 0);
}

/** 是不是衍生物 */
export function isToken(typeCode: number): boolean {
  return (typeCode & TYPE_TOKEN) > 0;
}

export function isMonster(typeCode: number): boolean {
  return (typeCode & TYPE_MONSTER) > 0;
}

export function isLinkMonster(typeCode: number): boolean {
  return (typeCode & TYPE_LINK) > 0;
}

/** 判断是灵摆怪兽 */
export function isPendulumMonster(typeCode: number): boolean {
  return (typeCode & TYPE_PENDULUM) > 0;
}

// 属性
// const ATTRIBUTE_ALL = 0x7f; //
export const ATTRIBUTE_EARTH = 0x01; //
export const ATTRIBUTE_WATER = 0x02; //
export const ATTRIBUTE_FIRE = 0x04; //
export const ATTRIBUTE_WIND = 0x08; //
export const ATTRIBUTE_LIGHT = 0x10; //
export const ATTRIBUTE_DARK = 0x20; //
export const ATTRIBUTE_DEVINE = 0x40; //

export const Attribute2StringCodeMap: Map<number, number> = new Map([
  [ATTRIBUTE_EARTH, 1010],
  [ATTRIBUTE_WATER, 1011],
  [ATTRIBUTE_FIRE, 1012],
  [ATTRIBUTE_WIND, 1013],
  [ATTRIBUTE_LIGHT, 1014],
  [ATTRIBUTE_DARK, 1015],
  [ATTRIBUTE_DEVINE, 1016],
]);

// 种族
export const RACE_WARRIOR = 0x1; //
export const RACE_SPELLCASTER = 0x2; //
export const RACE_FAIRY = 0x4; //
export const RACE_FIEND = 0x8; //
export const RACE_ZOMBIE = 0x10; //
export const RACE_MACHINE = 0x20; //
export const RACE_AQUA = 0x40; //
export const RACE_PYRO = 0x80; //
export const RACE_ROCK = 0x100; //
export const RACE_WINDBEAST = 0x200; //
export const RACE_PLANT = 0x400; //
export const RACE_INSECT = 0x800; //
export const RACE_THUNDER = 0x1000; //
export const RACE_DRAGON = 0x2000; //
export const RACE_BEAST = 0x4000; //
export const RACE_BEASTWARRIOR = 0x8000; //
export const RACE_DINOSAUR = 0x10000; //
export const RACE_FISH = 0x20000; //
export const RACE_SEASERPENT = 0x40000; //
export const RACE_REPTILE = 0x80000; //
export const RACE_PSYCHO = 0x100000; //
export const RACE_DEVINE = 0x200000; //
export const RACE_CREATORGOD = 0x400000; //
export const RACE_WYRM = 0x800000; //
export const RACE_CYBERSE = 0x1000000; //

export const Race2StringCodeMap: Map<number, number> = new Map([
  [RACE_WARRIOR, 1020],
  [RACE_SPELLCASTER, 1021],
  [RACE_FAIRY, 1022],
  [RACE_FIEND, 1023],
  [RACE_ZOMBIE, 1024],
  [RACE_MACHINE, 1025],
  [RACE_AQUA, 1026],
  [RACE_PYRO, 1027],
  [RACE_ROCK, 1028],
  [RACE_WINDBEAST, 1029],
  [RACE_PLANT, 1030],
  [RACE_INSECT, 1031],
  [RACE_THUNDER, 1032],
  [RACE_DRAGON, 1033],
  [RACE_BEAST, 1034],
  [RACE_BEASTWARRIOR, 1035],
  [RACE_DINOSAUR, 1036],
  [RACE_FISH, 1037],
  [RACE_SEASERPENT, 1038],
  [RACE_REPTILE, 1039],
  [RACE_PSYCHO, 1040],
  [RACE_DEVINE, 1041],
  [RACE_CREATORGOD, 1042],
  [RACE_WYRM, 1043],
  [RACE_CYBERSE, 1044],
]);

export const REASON_DESTROY = 0x1; //
// const REASON_RELEASE = 0x2; //
// const REASON_TEMPORARY = 0x4; //
export const REASON_MATERIAL = 0x8; //
// const REASON_SUMMON = 0x10; //
// const REASON_BATTLE = 0x20; //
// const REASON_EFFECT = 0x40; //
// const REASON_COST = 0x80; //
// const REASON_ADJUST = 0x100; //
// const REASON_LOST_TARGET = 0x200; //
// const REASON_RULE = 0x400; //
// const REASON_SPSUMMON = 0x800; //
// const REASON_DISSUMMON = 0x1000; //
// const REASON_FLIP = 0x2000; //
// const REASON_DISCARD = 0x4000; //
// const REASON_RDAMAGE = 0x8000; //
// const REASON_RRECOVER = 0x10000; //
// const REASON_RETURN = 0x20000; //
// const REASON_FUSION = 0x40000; //
// const REASON_SYNCHRO = 0x80000; //
// const REASON_RITUAL = 0x100000; //
// const REASON_XYZ = 0x200000; //
// const REASON_REPLACE = 0x1000000; //
// const REASON_DRAW = 0x2000000; //
// const REASON_REDIRECT = 0x4000000; //
// const REASON_REVEAL = 0x8000000; //
// const REASON_LINK = 0x10000000; //
// const REASON_LOST_OVERLAY = 0x20000000; //

export const QUERY_CODE = 0x1;
export const QUERY_POSITION = 0x2;
export const QUERY_ALIAS = 0x4;
export const QUERY_TYPE = 0x8;
export const QUERY_LEVEL = 0x10;
export const QUERY_RANK = 0x20;
export const QUERY_ATTRIBUTE = 0x40;
export const QUERY_RACE = 0x80;
export const QUERY_ATTACK = 0x100;
export const QUERY_DEFENSE = 0x200;
export const QUERY_BASE_ATTACK = 0x400;
export const QUERY_BASE_DEFENSE = 0x800;
export const QUERY_REASON = 0x1000;
export const QUERY_REASON_CARD = 0x2000;
export const QUERY_EQUIP_CARD = 0x4000;
export const QUERY_TARGET_CARD = 0x8000;
export const QUERY_OVERLAY_CARD = 0x10000;
export const QUERY_COUNTERS = 0x20000;
export const QUERY_OWNER = 0x40000;
export const QUERY_STATUS = 0x80000;
export const QUERY_LSCALE = 0x200000;
export const QUERY_RSCALE = 0x400000;
export const QUERY_LINK = 0x800000;

export const Phase2StringCodeMap: Map<number, number> = new Map([
  [PhaseType.DRAW, 20],
  [PhaseType.STANDBY, 21],
  [PhaseType.MAIN1, 22],
  [PhaseType.BATTLE_START, 28],
  [PhaseType.BATTLE_STEP, 29],
  [PhaseType.DAMAGE, 40],
  [PhaseType.DAMAGE_GAL, 42],
  [PhaseType.BATTLE, 24],
  [PhaseType.MAIN2, 22],
  [PhaseType.END, 26],
]);

// For Announce Card
const OPCODE_ADD = 0x40000000;
const OPCODE_SUB = 0x40000001;
const OPCODE_MUL = 0x40000002;
const OPCODE_DIV = 0x40000003;
const OPCODE_AND = 0x40000004;
const OPCODE_OR = 0x40000005;
const OPCODE_NEG = 0x40000006;
const OPCODE_NOT = 0x40000007;
const OPCODE_ISCODE = 0x40000100;
const OPCODE_ISSETCARD = 0x40000101;
const OPCODE_ISTYPE = 0x40000102;
const OPCODE_ISRACE = 0x40000103;
const OPCODE_ISATTRIBUTE = 0x40000104;

const CARD_MARINE_DOLPHIN = 78734254;
const CARD_TWINKLE_MOSS = 13857930;

/*
 * 判断一张卡是否能被宣言
 * 用于处理`AnnounceCard`
 * */
export function isDeclarable(card: CardMeta, opcodes: number[]): boolean {
  const stack: number[] = [];

  for (const opcode of opcodes) {
    switch (opcode) {
      case OPCODE_ADD: {
        if (stack.length >= 2) {
          const rhs = stack.pop()!;
          const lhs = stack.pop()!;
          stack.push(lhs + rhs);
        }
        break;
      }
      case OPCODE_SUB: {
        if (stack.length >= 2) {
          const rhs = stack.pop()!;
          const lhs = stack.pop()!;
          stack.push(lhs - rhs);
        }
        break;
      }
      case OPCODE_MUL: {
        if (stack.length >= 2) {
          const rhs = stack.pop()!;
          const lhs = stack.pop()!;
          stack.push(lhs * rhs);
        }
        break;
      }
      case OPCODE_DIV: {
        if (stack.length >= 2) {
          const rhs = stack.pop()!;
          const lhs = stack.pop()!;
          stack.push(lhs / rhs);
        }
        break;
      }
      case OPCODE_AND: {
        if (stack.length >= 2) {
          const rhs = stack.pop()!;
          const lhs = stack.pop()!;
          const b0 = rhs !== 0;
          const b1 = lhs !== 0;
          stack.push(Number(b0 && b1));
        }
        break;
      }
      case OPCODE_OR: {
        if (stack.length >= 2) {
          const rhs = stack.pop()!;
          const lhs = stack.pop()!;
          const b0 = rhs !== 0;
          const b1 = lhs !== 0;
          stack.push(Number(b0 || b1));
        }
        break;
      }
      case OPCODE_NEG: {
        if (stack.length >= 1) {
          const rhs = stack.pop()!;
          stack.push(-rhs);
        }
        break;
      }
      case OPCODE_NOT: {
        if (stack.length >= 1) {
          const rhs = stack.pop()!;
          stack.push(Number(rhs === 0));
        }
        break;
      }
      case OPCODE_ISCODE: {
        if (stack.length >= 1) {
          const code = stack.pop()!;
          stack.push(Number(code === card.id));
        }
        break;
      }
      case OPCODE_ISSETCARD: {
        if (stack.length >= 1) {
          const setCode = stack.pop()!;
          stack.push(Number(ifSetCard(setCode, card.data.setcode ?? 0)));
        }
        break;
      }
      case OPCODE_ISTYPE: {
        if (stack.length >= 1) {
          const type_ = stack.pop()!;
          stack.push(Number((type_ & (card.data.type ?? 0)) > 0));
        }
        break;
      }
      case OPCODE_ISRACE: {
        if (stack.length >= 1) {
          const race_ = stack.pop()!;
          stack.push(Number((race_ & (card.data.race ?? 0)) > 0));
        }
        break;
      }
      case OPCODE_ISATTRIBUTE: {
        if (stack.length >= 1) {
          const attribute_ = stack.pop()!;
          stack.push(Number((attribute_ & (card.data.attribute ?? 0)) > 0));
        }
        break;
      }
      default: {
        stack.push(opcode);
        break;
      }
    }
  }

  if (stack.length !== 1 || stack.pop() === 0) return false;

  return (
    card.id === CARD_MARINE_DOLPHIN ||
    card.id === CARD_TWINKLE_MOSS ||
    (!(card.data.alias !== 0) &&
      (card.data.type ?? 0 & (TYPE_MONSTER + TYPE_TOKEN)) !==
        TYPE_MONSTER + TYPE_TOKEN)
  );
}

function ifSetCard(setCodeToAnalyse: number, setCodeFromCard: number): boolean {
  let res = false;
  const settype = setCodeToAnalyse & 0xfff;
  const setsubtype = setCodeToAnalyse & 0xf000;
  let sc = setCodeFromCard;

  while (sc !== 0) {
    if ((sc & 0xfff) === settype && (sc & 0xf000 & setsubtype) === setsubtype)
      res = true;
    sc = sc >> 16;
  }

  return res;
}

export const STATUS_DISABLED = 0x0001;
// const STATUS_TO_ENABLE = 0x0002
// const STATUS_TO_DISABLE = 0x0004
// const STATUS_PROC_COMPLETE = 0x0008
// const STATUS_SET_TURN = 0x0010
// const STATUS_NO_LEVEL = 0x0020
// const STATUS_BATTLE_RESULT = 0x0040
// const STATUS_SPSUMMON_STEP = 0x0080
// const STATUS_FORM_CHANGED = 0x0100
// const STATUS_SUMMONING = 0x0200
// const STATUS_EFFECT_ENABLED = 0x0400
// const STATUS_SUMMON_TURN = 0x0800
// const STATUS_DESTROY_CONFIRMED = 0x1000
// const STATUS_LEAVE_CONFIRMED = 0x2000
// const STATUS_BATTLE_DESTROYED = 0x4000
// const STATUS_COPYING_EFFECT = 0x8000
// const STATUS_CHAINING = 0x10000
// const STATUS_SUMMON_DISABLED = 0x20000
// const STATUS_ACTIVATE_DISABLED = 0x40000
// const STATUS_EFFECT_REPLACED = 0x80000
// const STATUS_FLIP_SUMMONING = 0x100000
// const STATUS_ATTACK_CANCELED = 0x200000
// const STATUS_INITIALIZING = 0x400000
// const STATUS_TO_HAND_WITHOUT_CONFIRM = 0x800000
// const STATUS_JUST_POS = 0x1000000
// const STATUS_CONTINUOUS_POS = 0x2000000
export const STATUS_FORBIDDEN = 0x4000000;
// const STATUS_ACT_FROM_HAND = 0x8000000
// const STATUS_OPPO_BATTLE = 0x10000000
// const STATUS_FLIP_SUMMON_TURN = 0x20000000
// const STATUS_SPSUMMON_TURN = 0x40000000
// const STATUS_FLIP_SUMMON_DISABLED = 0x80000000
