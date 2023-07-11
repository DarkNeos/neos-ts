import { easings } from "@react-spring/web";

import { ygopro } from "@/api";
import { isMe } from "@/stores";

import { matConfig } from "@/ui/Shared";
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
    zone === SZONE ? BLOCK_HEIGHT_S * CARD_RATIO : BLOCK_HEIGHT_M * CARD_RATIO;

  let height = zone === SZONE ? BLOCK_HEIGHT_S : BLOCK_HEIGHT_M;

  // 首先计算 x 和 y
  let x = 0,
    y = 0;
  switch (zone) {
    case SZONE: {
      if (sequence === 5) {
        // 场地魔法
        x = -(3 * (BLOCK_WIDTH + COL_GAP) - (BLOCK_WIDTH - cardWidth) / 2);
        y = BLOCK_HEIGHT_M + ROW_GAP;
      } else {
        x = (sequence - 2) * (BLOCK_WIDTH + COL_GAP);
        y =
          2 * (BLOCK_HEIGHT_M + ROW_GAP) -
          (BLOCK_HEIGHT_M - BLOCK_HEIGHT_S) / 2;
      }
      break;
    }
    case MZONE: {
      if (sequence > 4) {
        // 额外怪兽区
        x = (sequence > 5 ? 1 : -1) * (BLOCK_WIDTH + COL_GAP);
        y = 0;
      } else {
        x = (sequence - 2) * (BLOCK_WIDTH + COL_GAP);
        y = BLOCK_HEIGHT_M + ROW_GAP;
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
  height = defence ? BLOCK_WIDTH : height;
  const rz = (isMe(controller) ? 0 : 180) + (defence ? 90 : 0);

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
        tension: 250,
        clamp: true,
        easing: easings.easeOutSine,
      },
    });
  }

  await asyncStart(api)({
    height,
    z: 0,
    zIndex: is_overlay ? 1 : 3,
    config: {
      easing: easings.easeInQuad,
      clamp: true,
    },
  });
};
