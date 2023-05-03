type CSSValue = [number, string] | number;

export type CSSConfig = Record<string, { value: number; unit: UNIT }>;

/** 转为CSS变量: BOARD_ROTATE_Z -> --board-rotate-z */
export const toCssProperties = (config: CSSConfig) =>
  Object.entries(config)
    .map(([k, v]) => ({
      [`--${k
        .split("_")
        .map((s) => s.toLowerCase())
        .join("-")}`]: `${v.value}${v.unit}`,
    }))
    .reduce((acc, cur) => ({ ...acc, ...cur }), {});

enum UNIT {
  PX = "px",
  DEG = "deg",
  NONE = "",
}

export const matConfig = {
  PERSPECTIVE: {
    value: 1500,
    unit: UNIT.PX,
  },
  PLANE_ROTATE_X: {
    value: 0,
    unit: UNIT.DEG,
  },
  BLOCK_WIDTH: {
    value: 120,
    unit: UNIT.PX,
  },
  BLOCK_HEIGHT_M: {
    value: 120,
    unit: UNIT.PX,
  }, // 主要怪兽区
  BLOCK_HEIGHT_S: {
    value: 110,
    unit: UNIT.PX,
  }, // 魔法陷阱区
  ROW_GAP: {
    value: 10,
    unit: UNIT.PX,
  },
  COL_GAP: {
    value: 10,
    unit: UNIT.PX,
  },
  CARD_RATIO: {
    value: 5.9 / 8.6,
    unit: UNIT.NONE,
  },
  HAND_MARGIN_TOP: {
    value: 0,
    unit: UNIT.PX,
  },
  HAND_CIRCLE_CENTER_OFFSET_Y: {
    value: 2000,
    unit: UNIT.PX,
  },
  HAND_CARD_HEIGHT: {
    value: 120,
    unit: UNIT.PX,
  },
  DECK_OFFSET_X: {
    value: 140,
    unit: UNIT.PX,
  },
  DECK_OFFSET_Y: {
    value: 80,
    unit: UNIT.PX,
  },
  DECK_ROTATE_Z: {
    value: 30,
    unit: UNIT.DEG,
  },
};
