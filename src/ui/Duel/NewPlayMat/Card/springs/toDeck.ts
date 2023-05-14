import { isMe, type CardType } from "@/stores";
import { SpringApi } from "./types";
import { matConfig } from "../../utils";
import { ygopro } from "@/api";
import { easings } from "@react-spring/web";
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
  DECK_CARD_HEIGHT,
} = matConfig;

const { HAND, GRAVE, REMOVED, DECK, EXTRA, MZONE, SZONE, TZONE, OVERLAY } =
  ygopro.CardZone;

export const moveToDeck = async (props: {
  card: CardType;
  api: SpringApi;
  report: boolean;
}) => {
  const { card, api, report } = props;
  // report
  const { zone, sequence, controller, xyzMonster, position } = card;

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
  api.start({
    x,
    y,
    z,
    rz,
    ry: isMe(controller) ? (zone === DECK ? 180 : 0) : 180,
    zIndex: z,
    height: DECK_CARD_HEIGHT.value,
  });
};
