import { easings } from "@react-spring/web";

import { ygopro } from "@/api";
import { type CardType, isMe } from "@/stores";

import { matConfig } from "../../utils";
import { SpringApi } from "./types";
import { asyncStart } from "./utils";

const {
  PLANE_ROTATE_X,
  BLOCK_WIDTH,
  BLOCK_HEIGHT_M,
  BLOCK_HEIGHT_S,
  CARD_RATIO,
  COL_GAP,
  ROW_GAP,
  HAND_MARGIN_TOP,
  HAND_CARD_HEIGHT,
  HAND_CIRCLE_CENTER_OFFSET_Y,
  DECK_OFFSET_X,
  DECK_OFFSET_Y,
  DECK_ROTATE_Z,
} = matConfig;

const { HAND, GRAVE, REMOVED, DECK, EXTRA, MZONE, SZONE, TZONE } =
  ygopro.CardZone;

export const moveToGround = async (props: {
  card: CardType;
  api: SpringApi;
}) => {
  const { card, api } = props;

  const { location } = card;

  const { controler, zone, sequence, position, is_overlay } = location;

  // 根据zone计算卡片的宽度
  const cardWidth =
    zone === SZONE
      ? BLOCK_HEIGHT_S.value * CARD_RATIO.value
      : BLOCK_HEIGHT_M.value * CARD_RATIO.value;

  let height = zone === SZONE ? BLOCK_HEIGHT_S.value : BLOCK_HEIGHT_M.value;

  // 首先计算 x 和 y
  let x = 0,
    y = 0;
  switch (zone) {
    case SZONE: {
      if (sequence === 5) {
        // 场地魔法
        x = -(
          3 * (BLOCK_WIDTH.value + COL_GAP.value) -
          (BLOCK_WIDTH.value - cardWidth) / 2
        );
        y = BLOCK_HEIGHT_M.value + ROW_GAP.value;
      } else {
        x = (sequence - 2) * (BLOCK_WIDTH.value + COL_GAP.value);
        y =
          2 * (BLOCK_HEIGHT_M.value + ROW_GAP.value) -
          (BLOCK_HEIGHT_M.value - BLOCK_HEIGHT_S.value) / 2;
      }
      break;
    }
    case MZONE: {
      if (sequence > 4) {
        // 额外怪兽区
        x = (sequence > 5 ? 1 : -1) * (BLOCK_WIDTH.value + COL_GAP.value);
        y = 0;
      } else {
        x = (sequence - 2) * (BLOCK_WIDTH.value + COL_GAP.value);
        y = BLOCK_HEIGHT_M.value + ROW_GAP.value;
      }
      break;
    }
  }

  if (!isMe(controler)) {
    x = -x;
    y = -y;
  }

  // 判断是不是防御表示
  const defence = [
    ygopro.CardPosition.DEFENSE,
    ygopro.CardPosition.FACEDOWN_DEFENSE,
    ygopro.CardPosition.FACEUP_DEFENSE,
  ].includes(position ?? 5);
  height = defence ? BLOCK_WIDTH.value : height;
  let rz = isMe(controler) ? 0 : 180;
  rz += defence ? 90 : 0;

  // 动画
  await asyncStart(api)({
    x,
    y,
    height,
    z: is_overlay ? 120 : 200,
    ry: [
      ygopro.CardPosition.FACEDOWN,
      ygopro.CardPosition.FACEDOWN_ATTACK,
      ygopro.CardPosition.FACEDOWN_DEFENSE,
    ].includes(position ?? 5)
      ? 180
      : 0,
    rz,
    config: {
      // mass: 0.5,
      easing: easings.easeInOutSine,
    },
  });
  await asyncStart(api)({
    z: 0,
    zIndex: is_overlay ? 1 : 3,
    config: {
      easing: easings.easeInOutQuad,
      mass: 5,
      tension: 300, // 170
      friction: 12, // 26
      clamp: true,
    },
  });
};
