import { createContext, type ReactNode, useContext, useMemo } from "react";
import { useSnapshot } from "valtio";

import { cardStore, type CardType, matStore } from "@/stores";
import { fieldInspection } from "@/stores/fieldInspection";

import { fieldRelations } from "./fieldRelations";

type Relations = ReturnType<typeof fieldRelations>;
const FieldRelationsContext = createContext({
  relations: [] as Relations,
  activeCards: new Set<string>(),
  pinned: null as string | null,
  inspected: null as string | null,
});

/** 全场只计算一次关系；卡片本体只接收自己的高亮布尔值。 */
export function FieldRelationsProvider({ children }: { children: ReactNode }) {
  const { inner } = useSnapshot(cardStore);
  const { chainCards } = useSnapshot(matStore);
  const { hovered, pinned } = useSnapshot(fieldInspection);
  const inspected = hovered ?? pinned;
  const relations = useMemo(
    // eslint-disable-next-line valtio/state-snapshot-rule -- 渲染派生值必须使用同一版本的快照。
    () => fieldRelations(inner as readonly CardType[], chainCards),
    [inner, chainCards],
  );
  const value = useMemo(() => {
    const activeCards = new Set<string>();
    for (const { source, target } of relations) {
      if (source.uuid === inspected || target.uuid === inspected) {
        activeCards.add(source.uuid);
        activeCards.add(target.uuid);
      }
    }
    // eslint-disable-next-line valtio/state-snapshot-rule -- Context 保存本次渲染的关系和检查状态。
    return { relations, activeCards, inspected, pinned };
  }, [relations, inspected, pinned]);
  return (
    <FieldRelationsContext.Provider value={value}>
      {children}
    </FieldRelationsContext.Provider>
  );
}

export const useFieldRelations = () => useContext(FieldRelationsContext);
