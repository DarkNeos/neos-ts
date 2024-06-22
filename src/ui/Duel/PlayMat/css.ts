// 此文件目的是在js和CSS之间共享一些变量，并且这些变量是0运行时的。
type CSSConfig = [string, [number, UNIT]][];

// 以1280长度的viewpoint为基准进行缩放
const VIEW_POINT_WIDTH_BASE_IPAD = 1280;
const VIEW_POINT_WIDTH_BASE_MOBILE = 1000;

const ZOOM_RATE_IPAD = 0.7;
const ZOOM_RATE_MOBILE = 0.5;

/** 转为CSS变量: BOARD_ROTATE_Z -> --board-rotate-z */
const toCssProperties = (config: CSSConfig) =>
  config
    .map(
      ([k, v]) =>
        [
          `--${k
            .split("_")
            .map((s) => s.toLowerCase())
            .join("-")}`,
          `${v[0]}${v[1]}`,
        ] as [string, string],
    )
    .reduce((acc, cur) => [...acc, cur], [] as [string, string][]);

const pxTransform = (value: number, unit: UNIT) => {
  if (unit === UNIT.PX && window.innerWidth < VIEW_POINT_WIDTH_BASE_MOBILE) {
    return [value * ZOOM_RATE_MOBILE, unit];
  } else if (
    unit === UNIT.PX &&
    window.innerWidth < VIEW_POINT_WIDTH_BASE_IPAD
  ) {
    return [value * ZOOM_RATE_IPAD, unit];
  } else {
    return [value, unit];
  }
};

enum UNIT {
  PX = "px",
  DEG = "deg",
  NONE = "",
}

const _matConfigWithUnit: Record<string, [number, UNIT]> = {
  PERSPECTIVE: [1500, UNIT.PX],
  PLANE_ROTATE_X: [0, UNIT.DEG],
  BLOCK_WIDTH: [120, UNIT.PX],
  BLOCK_HEIGHT_M: [120, UNIT.PX],
  BLOCK_HEIGHT_S: [110, UNIT.PX], // 魔法陷阱区
  ROW_GAP: [10, UNIT.PX],
  COL_GAP: [10, UNIT.PX],
  CARD_RATIO: [5.9 / 8.6, UNIT.NONE],
  HAND_MARGIN_TOP: [0, UNIT.PX],
  HAND_CIRCLE_CENTER_OFFSET_Y: [6000, UNIT.PX],
  HAND_CARD_HEIGHT: [130, UNIT.PX],
  HAND_MAT_OFFSET_Y: [140, UNIT.PX], // 手卡离场地的偏移
  DECK_OFFSET_X: [140, UNIT.PX],
  DECK_OFFSET_Y: [80, UNIT.PX],
  DECK_ROTATE_Z: [30, UNIT.DEG],
  DECK_CARD_HEIGHT: [120, UNIT.PX],
  CARD_HEIGHT_O: [100, UNIT.PX], // 场地魔法/墓地/除外的卡片高度
  BLOCK_OUTSIDE_OFFSET_X: [15, UNIT.PX],
};

const matConfigWithUnit = Object.entries(_matConfigWithUnit).map(
  ([k, [value, unit]]) => [k, pxTransform(value, unit) as [number, UNIT]],
) satisfies CSSConfig;

export const matConfig = matConfigWithUnit.reduce(
  (prev, [key, value]) => ({
    ...prev,
    // @ts-ignore
    [key]: value[0],
  }),
  {} as Record<keyof typeof _matConfigWithUnit, number>,
);

toCssProperties(matConfigWithUnit).forEach(([k, v]) => {
  document.body.style.setProperty(k, v);
});
