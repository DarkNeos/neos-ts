import { ygopro } from "@/api";
import { isMe } from "@/stores";

import { matConfig } from "../../css";
import type { MoveFunc } from "./types";
import { asyncStart } from "./utils";

const {
  BLOCK_WIDTH,
  BLOCK_HEIGHT_M,
  COL_GAP,
  ROW_GAP,
  CARD_HEIGHT_O,
  BLOCK_OUTSIDE_OFFSET_X,
  CARD_RATIO,
} = matConfig;

const { REMOVED } = ygopro.CardZone;

export const moveToOutside: MoveFunc = async (props) => {
  const { card, api } = props;
  const { zone, controller, position, sequence } = card.location;

  let x =
      BLOCK_WIDTH * 2.5 +
      COL_GAP * 2 +
      BLOCK_OUTSIDE_OFFSET_X +
      CARD_HEIGHT_O * CARD_RATIO * 0.5,
    y = ROW_GAP + BLOCK_HEIGHT_M + (BLOCK_HEIGHT_M - CARD_HEIGHT_O) / 2;
  if (zone === REMOVED) y -= ROW_GAP + CARD_HEIGHT_O;
  if (!isMe(controller)) {
    x = -x;
    y = -y;
  }
  await asyncStart(api)({
    x,
    y,
    z: 0,
    height: CARD_HEIGHT_O,
    rz: isMe(controller) ? 0 : 180,
    ry: [ygopro.CardPosition.FACEDOWN].includes(position) ? 180 : 0,
    subZ: 100,
    zIndex: sequence,
    config: {
      tension: 140,
    },
  });
  api.set({ subZ: 0 });
};
