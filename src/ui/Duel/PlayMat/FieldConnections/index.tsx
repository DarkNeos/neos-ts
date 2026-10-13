import { useId } from "react";

import { ygopro } from "@/api";
import { type CardType } from "@/stores";

import { matConfig } from "../css";
import { faceupField, fieldPoint } from "../fieldGeometry";
import { useFieldRelations } from "../FieldRelationsProvider";
import styles from "./index.module.scss";

export const FieldConnections = () => {
  const { relations, inspected } = useFieldRelations();
  const id = useId().replace(/:/g, "");
  const links = relations.filter(
    ({ source, target }) =>
      faceupField(source) &&
      faceupField(target) &&
      (source.uuid === inspected || target.uuid === inspected),
  );
  if (!links.length) return null;
  return (
    <svg
      className={styles.lines}
      width="1"
      height="1"
      role="img"
      aria-label="卡片关系：箭头从来源指向对象"
      data-testid="field-connections"
    >
      <defs>
        {[
          ["equip", "#f4d77c"],
          ["target", "#6bdfff"],
          ["chain", "#c6a5f5"],
        ].map(([kind, color]) => (
          <marker
            key={kind}
            id={`${id}-${kind}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerUnits="userSpaceOnUse"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path
              d="M2 1 8 5 2 9"
              fill="none"
              stroke={color}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        ))}
      </defs>
      {links.map(({ source, target, kind, number }) => {
        const origin = fieldPoint(source.location),
          destination = fieldPoint(target.location);
        const distance = Math.hypot(
          destination.x - origin.x,
          destination.y - origin.y,
        );
        if (!distance) return null;
        const dx = (destination.x - origin.x) / distance;
        const dy = (destination.y - origin.y) / distance;
        const from = cardEdge(source, dx, dy),
          to = cardEdge(target, -dx, -dy);
        const bend = kind === "equip" ? 14 : -14;
        const mid = {
          x: (from.x + to.x) / 2 - dy * bend,
          y: (from.y + to.y) / 2 + dx * bend,
        };
        const color =
          kind === "equip"
            ? "#f4d77c"
            : kind === "chain"
            ? "#c6a5f5"
            : "#6bdfff";
        // 相邻上下行之间空间很小，沿卡片侧边走线，留出数值和方向箭头的位置。
        const close =
          Math.abs(dy) > Math.abs(dx) &&
          Math.hypot(to.x - from.x, to.y - from.y) < 36;
        const side = kind === "equip" ? 1 : -1;
        const sideFrom = close ? cardEdge(source, side, 0) : from;
        const sideTo = close ? cardEdge(target, side, 0) : to;
        const rail =
          side > 0
            ? Math.max(sideFrom.x, sideTo.x) + 22
            : Math.min(sideFrom.x, sideTo.x) - 22;
        const path = close
          ? `M${sideFrom.x},${sideFrom.y} C${rail},${sideFrom.y} ${rail},${sideTo.y} ${sideTo.x},${sideTo.y}`
          : `M${from.x},${from.y} Q${mid.x},${mid.y} ${to.x},${to.y}`;
        return (
          <g key={`${source.uuid}-${target.uuid}-${kind}-${number}`}>
            <path
              data-testid="field-relation"
              data-kind={kind}
              data-source={source.uuid}
              data-target={target.uuid}
              data-relation-number={number}
              d={path}
              fill="none"
              stroke={color}
              strokeWidth="1.6"
              strokeDasharray="4 4"
              strokeLinecap="round"
              markerEnd={`url(#${id}-${kind})`}
            />
            <circle
              cx={sideFrom.x}
              cy={sideFrom.y}
              r="2.5"
              fill="#142130"
              stroke={color}
              strokeWidth="1.4"
            />
          </g>
        );
      })}
    </svg>
  );
};

// 箭头停在卡边，避免方向被卡图和数值遮住。
function cardEdge(card: CardType, dx: number, dy: number) {
  const { BLOCK_HEIGHT_M, BLOCK_HEIGHT_S, CARD_HEIGHT_O, CARD_RATIO } =
    matConfig;
  let height =
    card.location.zone === ygopro.CardZone.MZONE
      ? BLOCK_HEIGHT_M
      : card.location.sequence === 5
      ? CARD_HEIGHT_O
      : BLOCK_HEIGHT_S;
  let width = height * CARD_RATIO;
  if (card.location.position === ygopro.CardPosition.FACEUP_DEFENSE)
    [width, height] = [height, width];
  const offset = Math.min(
    (width / 2 + 5) / Math.abs(dx),
    (height / 2 + 5) / Math.abs(dy),
  );
  const center = fieldPoint(card.location);
  return { x: center.x + dx * offset, y: center.y + dy * offset };
}
