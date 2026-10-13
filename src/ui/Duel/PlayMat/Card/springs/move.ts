import { ygopro } from "@/api";

import { moveToDeck } from "./moveToDeck";
import { moveToGround } from "./moveToGround";
import { moveToHand } from "./moveToHand";
import { moveToOutside } from "./moveToOutside";
import { moveToToken } from "./moveToToken";
import type { MoveFunc } from "./types";
import { asyncStart, getDuration } from "./utils";

const { HAND, GRAVE, REMOVED, DECK, EXTRA, MZONE, SZONE, TZONE } =
  ygopro.CardZone;

export const move: MoveFunc = async (props) => {
  const { card, api, options } = props;
  if (!card.location.is_overlay) api.set({ opacity: 1 });
  if (options?.overlayAnimation === "prepare") {
    await asyncStart(api)({
      opacity: 0,
      config: { duration: getDuration(), clamp: true },
    });
    return;
  }
  // 宿主尚未登场或已经离场时，素材不单独飞向卡组、墓地等区域。
  if (card.location.is_overlay && ![MZONE, SZONE].includes(card.location.zone))
    return;
  switch (card.location.zone) {
    case MZONE:
    case SZONE:
      await moveToGround(props);
      break;
    case HAND:
      await moveToHand(props);
      break;
    case DECK:
    case EXTRA:
      await moveToDeck(props);
      break;
    case GRAVE:
    case REMOVED:
      await moveToOutside(props);
      break;
    case TZONE:
      await moveToToken(props);
      break;
  }
};
