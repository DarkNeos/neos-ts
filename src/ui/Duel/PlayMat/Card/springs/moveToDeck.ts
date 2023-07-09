import { ygopro } from "@/api";
import { isMe } from "@/stores";

import { matConfig } from "../../utils";
import { asyncStart, type MoveFunc } from "./utils";

const {
  BLOCK_WIDTH,
  BLOCK_HEIGHT_M,
  BLOCK_HEIGHT_S,
  COL_GAP,
  ROW_GAP,
  DECK_OFFSET_X,
  DECK_OFFSET_Y,
  DECK_ROTATE_Z,
  DECK_CARD_HEIGHT,
} = matConfig;

const { DECK, EXTRA } = ygopro.CardZone;

export const moveToDeck: MoveFunc = async (props) => {
  const { card, api } = props;
  // report
  const { location } = card;
  const { controller, zone, sequence } = location;

  const rightX = DECK_OFFSET_X.value + 2 * (BLOCK_WIDTH.value + COL_GAP.value);
  const leftX = -rightX;
  const bottomY =
    DECK_OFFSET_Y.value +
    2 * BLOCK_HEIGHT_M.value +
    BLOCK_HEIGHT_S.value +
    2 * ROW_GAP.value -
    BLOCK_HEIGHT_S.value;
  const topY = -bottomY;
  let x = isMe(controller) ? rightX : leftX;
  let y = isMe(controller) ? bottomY : topY;
  if (zone === EXTRA) {
    x = isMe(controller) ? leftX : rightX;
  }
  let rz = zone === EXTRA ? DECK_ROTATE_Z.value : -DECK_ROTATE_Z.value;
  rz += isMe(controller) ? 0 : 180;
  const z = sequence;

  await asyncStart(api)({
    x,
    y,
    z,
    rz,
    ry: isMe(controller) ? (zone === DECK ? 180 : 0) : 180,
    zIndex: z,
    height: DECK_CARD_HEIGHT.value,
  });
};
