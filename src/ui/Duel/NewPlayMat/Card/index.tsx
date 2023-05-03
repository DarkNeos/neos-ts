import React, { type CSSProperties, type FC } from "react";
import classnames from "classnames";
import { CardType, cardStore, isMe } from "@/stores";
import "./index.scss";
import { useSnapshot, INTERNAL_Snapshot as Snapshot } from "valtio";
import { watch } from "valtio/utils";
import { useSpringRef, useSpring, animated, to, CSS } from "@react-spring/web";
import { matConfig } from "../utils";
import { ygopro } from "@/api";
import { useConfig } from "@/config";

const NeosConfig = useConfig();

const { HAND, GRAVE, REMOVED, DECK, EXTRA, MZONE, SZONE, TZONE, OVERLAY } =
  ygopro.CardZone;

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

export const Card: FC<{ idx: number }> = React.memo(({ idx }) => {
  const state = cardStore.inner[idx];
  const snap = useSnapshot(state);
  const inintialCoord = calcCoordinate(state, false);
  const api = useSpringRef();
  const props = useSpring({
    ref: api,
    from: {
      x: inintialCoord.translateX,
      y: inintialCoord.translateY,
      z: inintialCoord.translateZ,
      rotateX: inintialCoord.rotateX,
      rotateY: inintialCoord.rotateY,
      rotateZ: inintialCoord.rotateZ,
      height: inintialCoord.height,
    },
  });
  const reloadPosition = (report: boolean) => {
    const coord = calcCoordinate(state, report);
    api.start({
      to: {
        x: coord.translateX,
        y: coord.translateY,
        z: coord.translateZ,
        rotateX: coord.rotateX,
        rotateY: coord.rotateY,
        rotateZ: coord.rotateZ,
        height: coord.height,
      },
    });
  };
  watch((get) => {
    const { zone, sequence, controller, xyzMonster } = get(state);
    reloadPosition(true);
  });

  // 在别的手卡更改时候，刷新这张手卡
  eventBus.on(
    "reload-hands",
    ({ sequence, controller }: { sequence: number; controller: number }) => {
      if (state.sequence !== sequence && state.controller === controller) {
        reloadPosition(false);
        // console.warn('reload')
      }
    }
  );

  return (
    <animated.div
      className="mat-card"
      style={
        {
          transform: to(
            [
              props.x,
              props.y,
              props.z,
              props.rotateX,
              props.rotateY,
              props.rotateZ,
            ],
            (x, y, z, rx, ry, rz) =>
              `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateZ(${rz}deg)`
          ),
          "--ry": props.rotateY,
          height: props.height,
        } as any as CSSProperties
      }
    >
      <div className="card-img-wrap">
        <img className="card-cover" src={getCardImgUrl(snap.code)} alt="" />
        <img className="card-back" src={getCardImgUrl(0, true)} alt="" />
      </div>
    </animated.div>
  );
});

function calcCoordinate(
  { zone, sequence, position, xyzMonster, controller }: CardType,
  report: boolean
) {
  const opponent = !isMe(controller);
  const res = {
    translateX: -BLOCK_WIDTH.value,
    translateY: BLOCK_HEIGHT_M.value + BLOCK_HEIGHT_S.value + ROW_GAP.value * 2,
    translateZ: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    height: 0,
  };
  let row = -1,
    col = -1;

  if ([MZONE, SZONE].includes(zone)) {
    row =
      zone === MZONE ? (sequence > 4 ? 2 : opponent ? 1 : 3) : opponent ? 0 : 4;
    col = sequence > 4 ? (sequence > 5 ? 3 : 1) : sequence;
    if (opponent) col = posHelper[col];
  }

  if (zone === OVERLAY && xyzMonster) {
    const { zone, sequence } = xyzMonster;
    row =
      zone === MZONE ? (sequence > 4 ? 2 : opponent ? 1 : 3) : opponent ? 0 : 4;
    col = sequence > 4 ? (sequence > 5 ? 3 : 1) : sequence;
    if (opponent) col = posHelper[col];
  }

  const isField = zone === SZONE && sequence === 5;
  if (isField) {
    row = opponent ? 1 : 3;
    col = opponent ? 5 : -1;
  }

  const _position =
    zone === OVERLAY && xyzMonster ? xyzMonster.position : position;
  const defense = [
    ygopro.CardPosition.DEFENSE,
    ygopro.CardPosition.FACEDOWN_DEFENSE,
    ygopro.CardPosition.FACEUP_DEFENSE,
  ].includes(_position ?? 5);

  res.rotateZ = opponent ? 180 : 0;
  res.rotateZ += defense ? 90 : 0;

  res.rotateY = [
    ygopro.CardPosition.FACEDOWN,
    ygopro.CardPosition.FACEDOWN_ATTACK,
    ygopro.CardPosition.FACEDOWN_DEFENSE,
  ].includes(_position ?? 5)
    ? 180
    : res.rotateY;
  res.rotateY = [DECK, EXTRA].includes(zone) ? 180 : 0;
  zone === HAND && (res.rotateY = opponent ? 180 : 0);

  res.height = defense
    ? BLOCK_WIDTH.value
    : zone === MZONE
    ? BLOCK_HEIGHT_M.value
    : BLOCK_HEIGHT_S.value;

  const blockPaddingX = (BLOCK_WIDTH.value - res.height * CARD_RATIO.value) / 2;

  if (row > -1) {
    // 说明是场上的卡
    res.translateX = (BLOCK_WIDTH.value + COL_GAP.value) * col + blockPaddingX;
    res.translateY =
      ROW_GAP.value * row +
      BLOCK_HEIGHT_M.value * Math.min(Math.max(0, row - 1), 3) +
      BLOCK_HEIGHT_S.value * Math.ceil(row / 4);
  }

  if (zone === HAND) {
    // 得刷新除了这个卡以外所有的自己的手卡
    if (report) {
      eventBus.emit("reload-hands", {
        controller,
        sequence,
      });
    }
    // 手卡会有很复杂的计算...
    const hand_circle_center_x =
      (5 * BLOCK_WIDTH.value + 4 * COL_GAP.value) / 2;
    const hand_circle_center_y =
      (3 * BLOCK_HEIGHT_M.value +
        2 * BLOCK_HEIGHT_S.value +
        4 * ROW_GAP.value) *
        Number(!opponent) +
      (HAND_MARGIN_TOP.value +
        HAND_CARD_HEIGHT.value +
        HAND_CIRCLE_CENTER_OFFSET_Y.value) *
        (opponent ? -1 : 1);
    const hand_card_width = CARD_RATIO.value * HAND_CARD_HEIGHT.value;
    const THETA =
      2 *
      Math.atan(
        hand_card_width /
          2 /
          (HAND_CIRCLE_CENTER_OFFSET_Y.value + HAND_CARD_HEIGHT.value)
      ) *
      0.9;
    // 接下来计算每一张手卡
    const hands_length = cardStore.at(HAND, controller).length;
    const angle = (sequence - (hands_length - 1) / 2) * THETA;
    const r = HAND_CIRCLE_CENTER_OFFSET_Y.value + HAND_CARD_HEIGHT.value / 2;
    const negativeX = Math.sin(angle) * r - hand_card_width / 2;
    const negativeY = Math.cos(angle) * r + HAND_CARD_HEIGHT.value / 2;
    const x = hand_circle_center_x + negativeX;
    const y =
      hand_circle_center_y -
      negativeY * (opponent ? -1 : 1) -
      Number(opponent) * HAND_CARD_HEIGHT.value;
    res.translateX = x;
    res.translateY = y;
    res.translateZ = 50;
    res.rotateZ =
      ((angle * 180) / Math.PI) * (opponent ? -1 : 1) + (opponent ? 180 : 0);
    res.rotateX = -PLANE_ROTATE_X.value;
  }

  if (zone === DECK || zone === EXTRA) {
    const leftX = -DECK_OFFSET_X.value;
    const rightX =
      DECK_OFFSET_X.value +
      5 * BLOCK_WIDTH.value +
      4 * COL_GAP.value -
      CARD_RATIO.value * res.height;
    const topY = -DECK_OFFSET_Y.value;
    const bottomY =
      DECK_OFFSET_Y.value +
      3 * BLOCK_HEIGHT_M.value +
      2 * BLOCK_HEIGHT_S.value +
      4 * ROW_GAP.value -
      BLOCK_HEIGHT_S.value;
    res.translateX = opponent ? leftX : rightX;
    res.translateY = opponent ? topY : bottomY;
    if (zone === EXTRA) {
      res.translateX = opponent ? rightX : leftX;
    }
    res.rotateZ = opponent ? -DECK_ROTATE_Z.value : 180 - DECK_ROTATE_Z.value;
    if (zone === EXTRA) {
      res.rotateZ = opponent ? DECK_ROTATE_Z.value : DECK_ROTATE_Z.value;
    }
    res.translateZ = sequence;
  }

  return res;
}

const posHelper: Record<number, number> = {
  0: 4,
  1: 3,
  2: 2,
  3: 1,
  4: 0,
  5: 6,
  6: 5,
};

function getCardImgUrl(code: number, back = false) {
  const ASSETS_BASE =
    import.meta.env.BASE_URL == "/"
      ? NeosConfig.assetsPath
      : import.meta.env.BASE_URL + NeosConfig.assetsPath;
  if (back) {
    return ASSETS_BASE + "/card_back.jpg";
  }
  return NeosConfig.cardImgUrl + "/" + code + ".jpg";
}
