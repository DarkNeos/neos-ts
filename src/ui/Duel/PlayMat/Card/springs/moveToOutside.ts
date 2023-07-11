import { ygopro } from "@/api";
import { isMe } from "@/stores";

import { matConfig } from "../../utils";
import { asyncStart, type MoveFunc } from "./utils";

const { BLOCK_WIDTH, BLOCK_HEIGHT_M, BLOCK_HEIGHT_S, COL_GAP, ROW_GAP } =
  matConfig;

const { GRAVE } = ygopro.CardZone;

export const moveToOutside: MoveFunc = async (props) => {
  const { card, api } = props;
  // report
  const { zone, controller, position, sequence } = card.location;

  let x = (BLOCK_WIDTH.value + COL_GAP.value) * 3,
    y = zone === GRAVE ? BLOCK_HEIGHT_M.value + ROW_GAP.value : 0;
  if (!isMe(controller)) {
    x = -x;
    y = -y;
  }
  await asyncStart(api)({
    x,
    y,
    z: 0,
    height: BLOCK_HEIGHT_S.value,
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
