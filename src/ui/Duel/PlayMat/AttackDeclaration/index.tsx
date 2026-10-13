import { useId } from "react";
import { useSnapshot } from "valtio";

import { ygopro } from "@/api";
import { cardStore, matStore } from "@/stores";

import { directAttackPoint, fieldPoint } from "../fieldGeometry";
import styles from "./index.module.scss";

export const AttackDeclaration = () => {
  const { attackDeclaration } = useSnapshot(matStore);
  const { inner } = useSnapshot(cardStore);
  const id = useId().replace(/:/g, "");
  if (!attackDeclaration) return null;
  const attacker = inner.find(
    (card) => card.uuid === attackDeclaration.attackerUuid,
  );
  const target = inner.find(
    (card) => card.uuid === attackDeclaration.targetUuid,
  );
  if (
    !attacker ||
    attacker.location.zone !== ygopro.CardZone.MZONE ||
    (!attackDeclaration.directAttack &&
      (!target || target.location.zone !== ygopro.CardZone.MZONE))
  )
    return null;
  const from = fieldPoint(attacker.location);
  const to = target
    ? fieldPoint(target.location)
    : directAttackPoint(attacker.location.controller);
  const dx = to.x - from.x,
    dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (!distance) return null;
  const offset = Math.min(48, distance / 4);
  const path = `M${from.x + (dx / distance) * offset},${
    from.y + (dy / distance) * offset
  } L${to.x - (dx / distance) * offset},${to.y - (dy / distance) * offset}`;
  return (
    <svg
      className={styles.arrow}
      width="1"
      height="1"
      role="img"
      aria-label={target ? "攻击目标" : "直接攻击"}
      data-testid="duel-attack-declaration"
      data-attacker={attacker.uuid}
      data-target={target?.uuid ?? "direct"}
    >
      <defs>
        <marker
          id={id}
          viewBox="0 0 20 20"
          refX="16"
          refY="10"
          markerUnits="userSpaceOnUse"
          markerWidth="24"
          markerHeight="24"
          orient="auto"
        >
          <path d="M2 2 17 10 2 18 7 10Z" fill="currentColor" />
        </marker>
      </defs>
      <path className={styles.outline} d={path} />
      <path className={styles.line} d={path} markerEnd={`url(#${id})`} />
      {!target && (
        <text
          x={to.x}
          y={to.y + (to.y < 0 ? -14 : 24)}
          textAnchor="middle"
          className={styles.label}
        >
          直接攻击
        </text>
      )}
    </svg>
  );
};
