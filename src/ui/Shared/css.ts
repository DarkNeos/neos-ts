// 此文件目的是在js和CSS之间共享一些变量，并且这些变量是0运行时的。
interface CSSConfig {
  readonly [key: string]: [number, UNIT];
}

/** 转为CSS变量: BOARD_ROTATE_Z -> --board-rotate-z */
const toCssProperties = (config: CSSConfig) =>
  Object.entries(config)
    .map(
      ([k, v]) =>
        [
          `--${k
            .split("_")
            .map((s) => s.toLowerCase())
            .join("-")}`,
          `${v[0]}${v[1]}`,
        ] as [string, string]
    )
    .reduce((acc, cur) => [...acc, cur], [] as [string, string][]);

enum UNIT {
  PX = "px",
  DEG = "deg",
  NONE = "",
}

const matConfigWithUnit = {
  PERSPECTIVE: [1500, UNIT.PX],
  PLANE_ROTATE_X: [0, UNIT.DEG],
  BLOCK_WIDTH: [120, UNIT.PX],
  BLOCK_HEIGHT_M: [120, UNIT.PX],
  BLOCK_HEIGHT_S: [110, UNIT.PX], // 魔法陷阱区
  ROW_GAP: [10, UNIT.PX],
  COL_GAP: [10, UNIT.PX],
  CARD_RATIO: [5.9 / 8.6, UNIT.NONE],
  HAND_MARGIN_TOP: [0, UNIT.PX],
  HAND_CIRCLE_CENTER_OFFSET_Y: [2000, UNIT.PX],
  HAND_CARD_HEIGHT: [130, UNIT.PX],
  DECK_OFFSET_X: [140, UNIT.PX],
  DECK_OFFSET_Y: [80, UNIT.PX],
  DECK_ROTATE_Z: [30, UNIT.DEG],
  DECK_CARD_HEIGHT: [120, UNIT.PX],
  CARD_HEIGHT_O: [100, UNIT.PX], // 场地魔法/墓地/除外的卡片高度
  BLOCK_OUTSIDE_OFFSET_X: [15, UNIT.PX],
} satisfies CSSConfig;

export const matConfig = Object.keys(matConfigWithUnit).reduce(
  (prev, key) => ({
    ...prev,
    // @ts-ignore
    [key]: matConfigWithUnit[key][0],
  }),
  {} as Record<keyof typeof matConfigWithUnit, number>
);

toCssProperties(matConfigWithUnit).forEach(([k, v]) => {
  document.body.style.setProperty(k, v);
});
