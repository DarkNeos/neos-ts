// 暂时先简单实现攻击动画，后面有时间再慢慢优化
import { easings } from "@react-spring/web";

import { ygopro } from "@/api";
import { CardType, isMe } from "@/stores";
import { matConfig } from "@/ui/Shared";

import type { SpringApi } from "./types";
import { asyncStart } from "./utils";

const { BLOCK_WIDTH, BLOCK_HEIGHT_M, BLOCK_HEIGHT_S, COL_GAP, ROW_GAP } =
  matConfig;

export const attack = async (props: {
  card: CardType;
  api: SpringApi;
  directAttack: boolean;
  target?: ygopro.CardLocation;
}) => {
  const { card, api, directAttack, target } = props;
  const current = api.current[0].get();

  let x = current.x;
  let y = current.y;
  let rz = current.rz;
  if (directAttack) {
    // 直接攻击
    y = BLOCK_HEIGHT_M + BLOCK_HEIGHT_S;

    if (isMe(card.location.controller)) {
      y = -y;
    }
  } else if (target) {
    // 攻击`target`
    const { controller, sequence } = target;
    if (sequence > 4) {
      // 额外怪兽区
      x = (sequence > 5 ? 1 : -1) * (BLOCK_WIDTH + COL_GAP);
      y = 0;
    } else {
      x = (sequence - 2) * (BLOCK_WIDTH + COL_GAP);
      y = BLOCK_HEIGHT_M + ROW_GAP;
    }

    if (!isMe(controller)) {
      x = -x;
      y = -y;
    }

    rz += -Math.atan((x - current.x) / (y - current.y)) / (Math.PI / 180);
  } else {
    console.error(`<Spring/Attack>directAttack is false and target is null.`);
    return;
  }

  // 先浮空
  await asyncStart(api)({
    z: 200,
  });
  // 后撤半个卡位，并调整倾斜角
  await asyncStart(api)({
    y:
      current.y +
      (BLOCK_HEIGHT_M / 2) * (isMe(card.location.controller) ? 1 : -1),
    rz,
  });
  // 加速前冲
  await asyncStart(api)({
    x,
    y,
    config: {
      easing: easings.easeInOutSine,
    },
  });
  // 减速归位
  await asyncStart(api)({
    x: current.x,
    y: current.y,
    z: current.z,
    rz: current.rz,
    config: {
      easing: easings.easeInOutQuad,
    },
  });
};
