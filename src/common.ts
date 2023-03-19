//! 一些Neos中基础的数据结构

// 类型
const TYPE_MONSTER = 0x1; //
const TYPE_SPELL = 0x2; //
const TYPE_TRAP = 0x4; //
const TYPE_NORMAL = 0x10; //
const TYPE_EFFECT = 0x20; //
const TYPE_FUSION = 0x40; //
const TYPE_RITUAL = 0x80; //
const TYPE_TRAPMONSTER = 0x100; //
const TYPE_SPIRIT = 0x200; //
const TYPE_UNION = 0x400; //
const TYPE_DUAL = 0x800; //
const TYPE_TUNER = 0x1000; //
const TYPE_SYNCHRO = 0x2000; //
const TYPE_TOKEN = 0x4000; //
const TYPE_QUICKPLAY = 0x10000; //
const TYPE_CONTINUOUS = 0x20000; //
const TYPE_EQUIP = 0x40000; //
const TYPE_FIELD = 0x80000; //
const TYPE_COUNTER = 0x100000; //
const TYPE_FLIP = 0x200000; //
const TYPE_TOON = 0x400000; //
const TYPE_XYZ = 0x800000; //
const TYPE_PENDULUM = 0x1000000; //
const TYPE_SPSUMMON = 0x2000000; //
const TYPE_LINK = 0x4000000; //

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

// 属性
// const ATTRIBUTE_ALL = 0x7f; //
const ATTRIBUTE_EARTH = 0x01; //
const ATTRIBUTE_WATER = 0x02; //
const ATTRIBUTE_FIRE = 0x04; //
const ATTRIBUTE_WIND = 0x08; //
const ATTRIBUTE_LIGHT = 0x10; //
const ATTRIBUTE_DARK = 0x20; //
const ATTRIBUTE_DEVINE = 0x40; //

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
const RACE_WARRIOR = 0x1; //
const RACE_SPELLCASTER = 0x2; //
const RACE_FAIRY = 0x4; //
const RACE_FIEND = 0x8; //
const RACE_ZOMBIE = 0x10; //
const RACE_MACHINE = 0x20; //
const RACE_AQUA = 0x40; //
const RACE_PYRO = 0x80; //
const RACE_ROCK = 0x100; //
const RACE_WINDBEAST = 0x200; //
const RACE_PLANT = 0x400; //
const RACE_INSECT = 0x800; //
const RACE_THUNDER = 0x1000; //
const RACE_DRAGON = 0x2000; //
const RACE_BEAST = 0x4000; //
const RACE_BEASTWARRIOR = 0x8000; //
const RACE_DINOSAUR = 0x10000; //
const RACE_FISH = 0x20000; //
const RACE_SEASERPENT = 0x40000; //
const RACE_REPTILE = 0x80000; //
const RACE_PSYCHO = 0x100000; //
const RACE_DEVINE = 0x200000; //
const RACE_CREATORGOD = 0x400000; //
const RACE_WYRM = 0x800000; //
const RACE_CYBERSE = 0x1000000; //

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

// const REASON_DESTROY = 0x1; //
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
