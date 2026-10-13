import { ygopro } from "@/api";
import { cardStore, isMe, matStore } from "@/stores";

import { matConfig } from "../../css";
import type { MoveFunc } from "./types";
import { asyncStart, getDuration } from "./utils";

const {
  BLOCK_WIDTH,
  BLOCK_HEIGHT_M,
  COL_GAP,
  ROW_GAP,
  DECK_OFFSET_X,
  DECK_OFFSET_Y,
  DECK_ROTATE_Z,
  DECK_CARD_HEIGHT,
} = matConfig;

const { DECK, EXTRA } = ygopro.CardZone;

const isFaceup = (position: ygopro.CardPosition) =>
  [
    ygopro.CardPosition.FACEUP,
    ygopro.CardPosition.FACEUP_ATTACK,
    ygopro.CardPosition.FACEUP_DEFENSE,
  ].includes(position);

interface StackCard {
  location: Pick<
    ygopro.CardLocation,
    "zone" | "controller" | "sequence" | "position" | "is_overlay"
  >;
}

export const getExtraDeckStackIndex = (
  card: StackCard,
  cards: readonly StackCard[],
) => {
  const { zone, controller, sequence, position, is_overlay } = card.location;
  if (zone !== EXTRA || is_overlay) return undefined;
  const faceup = isFaceup(position);
  // 显示顺序独立于协议序号，表侧卡始终叠在里侧卡上方。
  return cards.filter(
    ({ location }) =>
      location.zone === EXTRA &&
      location.controller === controller &&
      !location.is_overlay &&
      (isFaceup(location.position) === faceup
        ? location.sequence < sequence
        : faceup),
  ).length;
};

export const moveToDeck: MoveFunc = async (props) => {
  const { card, api } = props;
  // report
  const { location } = card;
  const { controller, zone, sequence } = location;

  const rightX = DECK_OFFSET_X + 2 * (BLOCK_WIDTH + COL_GAP);
  const leftX = -rightX;
  const bottomY = DECK_OFFSET_Y + 2 * BLOCK_HEIGHT_M + 2 * ROW_GAP;
  const topY = -bottomY;
  let x = isMe(controller) ? rightX : leftX;
  let y = isMe(controller) ? bottomY : topY;
  if (zone === EXTRA) {
    x = isMe(controller) ? leftX : rightX;
  }
  let rz = zone === EXTRA ? DECK_ROTATE_Z : -DECK_ROTATE_Z;
  rz += isMe(controller) ? 0 : 180;
  const z = getExtraDeckStackIndex(card, cardStore.inner) ?? sequence;
  const faceup =
    (zone === DECK && matStore.deckReserved) || isFaceup(location.position);

  await asyncStart(api)({
    x,
    y,
    z,
    rz,
    ry: faceup ? 0 : 180,
    zIndex: z,
    height: DECK_CARD_HEIGHT,

    config: {
      duration: getDuration(),
    },
  });
};
