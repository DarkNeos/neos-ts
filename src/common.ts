//! 一些Neos中基础的数据结构

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

// const ATTRIBUTE_ALL = 0x7f; //
const ATTRIBUTE_EARTH = 0x01; //
const ATTRIBUTE_WATER = 0x02; //
const ATTRIBUTE_FIRE = 0x04; //
const ATTRIBUTE_WIND = 0x08; //
const ATTRIBUTE_LIGHT = 0x10; //
const ATTRIBUTE_DARK = 0x20; //
const ATTRIBUTE_DEVINE = 0x40; //

/*
 * 在做卡牌信息展示的时候，发现`CardMeta`里面的数据和`strings.conf`配置文件
 * 里面的code是不对应的，这里定义一个哈希表来管理其中的映射关系。
 *
 * metaCode -> stringCode
 * */
export const Meta2StringCodeMap: Map<number, number> = new Map([
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
  [ATTRIBUTE_EARTH, 1010],
  [ATTRIBUTE_WATER, 1011],
  [ATTRIBUTE_FIRE, 1012],
  [ATTRIBUTE_WIND, 1013],
  [ATTRIBUTE_LIGHT, 1014],
  [ATTRIBUTE_DARK, 1015],
  [ATTRIBUTE_DEVINE, 1016],
]);
