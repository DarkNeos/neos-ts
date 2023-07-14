import { ygopro } from "@/api";
import { cardStore, isMe } from "@/stores";
import { matConfig } from "@/ui/Shared";

import { asyncStart } from "./utils";
import type { MoveFunc } from "./types";

const {
  BLOCK_HEIGHT_M,
  BLOCK_HEIGHT_S,
  CARD_RATIO,
  ROW_GAP,
  HAND_MARGIN_TOP,
  HAND_CARD_HEIGHT,
  HAND_CIRCLE_CENTER_OFFSET_Y,
} = matConfig;

const { HAND } = ygopro.CardZone;

export const moveToHand: MoveFunc = async (props) => {
  const { card, api } = props;
  const { sequence, controller } = card.location;
  // 手卡会有很复杂的计算...
  const hand_circle_center_x = 0;
  const hand_circle_center_y =
    1 * BLOCK_HEIGHT_M +
    1 * BLOCK_HEIGHT_S +
    2 * ROW_GAP +
    (HAND_MARGIN_TOP + HAND_CARD_HEIGHT + HAND_CIRCLE_CENTER_OFFSET_Y);
  const hand_card_width = CARD_RATIO * HAND_CARD_HEIGHT;
  const THETA =
    2 *
    Math.atan(
      hand_card_width / 2 / (HAND_CIRCLE_CENTER_OFFSET_Y + HAND_CARD_HEIGHT)
    ) *
    0.9;
  // 接下来计算每一张手卡
  const hands_length = cardStore.at(HAND, controller).length;
  const angle = (sequence - (hands_length - 1) / 2) * THETA;
  const r = HAND_CIRCLE_CENTER_OFFSET_Y + HAND_CARD_HEIGHT / 2;
  const negativeX = Math.sin(angle) * r;
  const negativeY = Math.cos(angle) * r + HAND_CARD_HEIGHT / 2;
  const x = hand_circle_center_x + negativeX * (isMe(controller) ? 1 : -1);
  const y = hand_circle_center_y - negativeY + 140; // FIXME: 常量 是手动调的 这里肯定有问题 有空来修

  const _rz = (angle * 180) / Math.PI;

  await asyncStart(api)({
    x: isMe(controller) ? x : -x,
    y: isMe(controller) ? y : -y,
    z: sequence + 5,
    rz: isMe(controller) ? _rz : 180 - _rz,
    ry: isMe(controller) ? 0 : 180,
    height: HAND_CARD_HEIGHT,
    zIndex: sequence,
    // rx: -PLANE_ROTATE_X,
  });
};
