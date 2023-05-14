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
} = matConfig;

const { HAND, GRAVE, REMOVED, DECK, EXTRA, MZONE, SZONE, TZONE, OVERLAY } =
  ygopro.CardZone;

export const moveToOutside = async (props: {
  card: CardType;
  api: SpringApi;
  report: boolean;
}) => {
  const { card, api, report } = props;
  // report
  const { zone, sequence, controller, xyzMonster, position, overlayMaterials } =
    card;

  let x = (BLOCK_WIDTH.value + COL_GAP.value) * 3,
    y = zone === GRAVE ? BLOCK_HEIGHT_M.value + ROW_GAP.value : 0;
  if (!isMe(controller)) {
    x = -x;
    y = -y;
  }
  api.start({
    x,
    y,
    z: 0,
    height: BLOCK_HEIGHT_S.value,
    rz: isMe(controller) ? 0 : 180,
  });
};
