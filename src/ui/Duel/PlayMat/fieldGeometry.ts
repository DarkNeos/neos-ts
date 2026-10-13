import { ygopro } from "@/api";
import { TYPE_LINK } from "@/common";
import { type CardType, isMe } from "@/stores";

import { matConfig } from "./css";

export const linkDirections = [
  { bit: 1, dx: -1, dy: 1, angle: 225 },
  { bit: 2, dx: 0, dy: 1, angle: 180 },
  { bit: 4, dx: 1, dy: 1, angle: 135 },
  { bit: 8, dx: -1, dy: 0, angle: 270 },
  { bit: 32, dx: 1, dy: 0, angle: 90 },
  { bit: 64, dx: -1, dy: -1, angle: 315 },
  { bit: 128, dx: 0, dy: -1, angle: 0 },
  { bit: 256, dx: 1, dy: -1, angle: 45 },
];

export function faceupField(card: Pick<CardType, "location">) {
  const { location } = card;
  return (
    !location.is_overlay &&
    [ygopro.CardZone.MZONE, ygopro.CardZone.SZONE].includes(location.zone) &&
    [
      ygopro.CardPosition.FACEUP,
      ygopro.CardPosition.FACEUP_ATTACK,
      ygopro.CardPosition.FACEUP_DEFENSE,
    ].includes(location.position)
  );
}
/** 将双方协议序号映射到同一棋盘；两方的额外怪兽区域共享实际坐标。 */
export function monsterGrid(controller: number, sequence: number) {
  const direction = isMe(controller) ? 1 : -1;
  return {
    x: direction * (sequence < 5 ? sequence - 2 : sequence === 5 ? -1 : 1),
    y: sequence < 5 ? direction : 0,
  };
}
export function zoneKey(controller: number, sequence: number) {
  const { x, y } = monsterGrid(controller, sequence);
  return `${x},${y}`;
}
export function linkedZoneKeys(card?: CardType) {
  const result = new Set<string>();
  if (
    !card ||
    !faceupField(card) ||
    card.location.zone !== ygopro.CardZone.MZONE ||
    !((card.meta.data.type ?? 0) & TYPE_LINK)
  )
    return result;
  const origin = monsterGrid(card.location.controller, card.location.sequence);
  // 箭头以卡片控制者的朝向为基准，对方卡片需反转方向，再过滤不存在的区域。
  const sign = isMe(card.location.controller) ? 1 : -1;
  const mask =
    card.meta.data.linkMarkers ??
    card.originalData?.linkMarkers ??
    card.meta.data.def ??
    0;
  for (const { bit, dx, dy } of linkDirections) {
    if (!(mask & bit)) continue;
    const x = origin.x + dx * sign,
      y = origin.y + dy * sign;
    if (
      (Math.abs(y) === 1 && Math.abs(x) <= 2) ||
      (y === 0 && Math.abs(x) === 1)
    )
      result.add(`${x},${y}`);
  }
  return result;
}

/** 与 moveToGround 使用同一场地坐标，关系线随场地整体缩放和视角移动。 */
export function fieldPoint(
  location: Pick<ygopro.CardLocation, "zone" | "controller" | "sequence">,
) {
  const {
    BLOCK_WIDTH: w,
    BLOCK_HEIGHT_M: h,
    BLOCK_HEIGHT_S: s,
    COL_GAP: gap,
    ROW_GAP: row,
    BLOCK_OUTSIDE_OFFSET_X: offset,
    CARD_HEIGHT_O: outside,
    CARD_RATIO: ratio,
  } = matConfig;
  if (location.zone === ygopro.CardZone.MZONE) {
    const point = monsterGrid(location.controller, location.sequence);
    return { x: point.x * (w + gap), y: point.y * (h + row) };
  }
  const sign = isMe(location.controller) ? 1 : -1;
  return location.sequence === 5
    ? {
        x: -sign * (w * 2.5 + gap * 2 + offset + (outside * ratio) / 2),
        y: sign * (row + h + (h - outside) / 2),
      }
    : {
        x: sign * (location.sequence - 2) * (w + gap),
        y: sign * (2 * (h + row) - (h - s) / 2),
      };
}

/** 直接攻击指向防守方场地外缘，随双方视角翻转。 */
export function directAttackPoint(controller: number) {
  const { BLOCK_HEIGHT_M, BLOCK_HEIGHT_S, ROW_GAP } = matConfig;
  return {
    x: 0,
    y:
      (isMe(controller) ? -1 : 1) *
      (BLOCK_HEIGHT_M * 1.5 + BLOCK_HEIGHT_S + ROW_GAP * 2),
  };
}
