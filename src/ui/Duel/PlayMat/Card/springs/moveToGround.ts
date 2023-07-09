import { easings } from "@react-spring/web";

import { ygopro } from "@/api";
import { isMe } from "@/stores";

import { matConfig } from "../../utils";
import { asyncStart, type MoveFunc } from "./utils";

const {
  BLOCK_WIDTH,
  BLOCK_HEIGHT_M,
  BLOCK_HEIGHT_S,
  CARD_RATIO,
  COL_GAP,
  ROW_GAP,
} = matConfig;

const { MZONE, SZONE, TZONE } = ygopro.CardZone;

export const moveToGround: MoveFunc = async (props) => {
  const { card, api, fromZone } = props;

  const { location } = card;

  const { controller, zone, sequence, position, is_overlay } = location;

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

  if (!isMe(controller)) {
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
  let rz = isMe(controller) ? 0 : 180;
  rz += defence ? 90 : 0;

  const ry = [
    ygopro.CardPosition.FACEDOWN,
    ygopro.CardPosition.FACEDOWN_ATTACK,
    ygopro.CardPosition.FACEDOWN_DEFENSE,
  ].includes(position ?? 5)
    ? 180
    : 0;

  // 动画
  if (fromZone === TZONE) {
    // 如果是Token，直接先移动到那个位置，然后再放大
    api.set({
      x,
      y,
      ry,
      rz,
      height: 0,
    });
  } else {
    await asyncStart(api)({
      x,
      y,
      height,
      z: is_overlay ? 120 : 200,
      ry,
      rz,
      config: {
        // mass: 0.5,
        easing: easings.easeInOutSine,
      },
    });
  }

  await asyncStart(api)({
    height,
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
