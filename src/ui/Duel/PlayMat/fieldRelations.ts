import type { CardType } from "@/stores";

import { faceupField } from "./fieldGeometry";

/** 标记和连线共用顺序，确保关系两端的编号一致。 */
export function fieldRelations(
  cards: readonly CardType[],
  chains: readonly {
    code: number;
    cardUuid?: string;
    targets?: readonly string[];
  }[] = [],
) {
  const visible = new Map(
    cards.filter(faceupField).map((card) => [card.uuid, card]),
  );
  const counts = { equip: 0, target: 0 };
  const relations: {
    source: CardType;
    target: CardType;
    kind: "equip" | "target" | "chain";
    number: number;
  }[] = [...visible.values()].flatMap((source) => {
    const targets: { target: string; kind: "equip" | "target" }[] = [
      ...(source.equipTarget
        ? [{ target: source.equipTarget, kind: "equip" as const }]
        : []),
      ...[...new Set(source.effectTargets)].map((target) => ({
        target,
        kind: "target" as const,
      })),
    ];
    return targets.flatMap(({ target: uuid, kind }) => {
      const target = visible.get(uuid);
      if (!target || target === source) return [];
      return [{ source, target, kind, number: ++counts[kind] }];
    });
  });
  const all = new Map(cards.map((card) => [card.uuid, card]));
  chains.forEach((entry, index) => {
    const source = entry.cardUuid ? all.get(entry.cardUuid) : undefined;
    if (!source || source.code !== entry.code) return;
    for (const uuid of new Set(entry.targets)) {
      const target = all.get(uuid);
      if (target && target !== source)
        relations.push({ source, target, kind: "chain", number: index + 1 });
    }
  });
  return relations;
}
