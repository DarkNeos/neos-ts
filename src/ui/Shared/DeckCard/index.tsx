import React, { memo, useMemo, useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { useSnapshot } from "valtio";

import { CardMeta, forbidden, forbidden_408 } from "@/api";
import { useConfig } from "@/config";
import { banlistStore } from "@/stores/banlistStore";

import { Type } from "../DeckZone";
import { YgoCard } from "../YgoCard";
import styles from "./index.module.scss";

const { assetsPath } = useConfig();

export interface DeckCardMouseUpEvent {
  event: React.MouseEvent;
  card: CardMeta;
  /** 标识同名卡中的具体副本，搜索结果不需要此索引。 */
  index?: number;
}

/** 跨区域拖放和区域内排序共用的卡片来源信息。 */
export interface DeckCardDragItem {
  value: CardMeta;
  source: Type | "search";
  index?: number;
}

/** 组卡页和Side页使用的单张卡片，增加了文字和禁限数量 */
export const DeckCard: React.FC<{
  value: CardMeta;
  source: Type | "search";
  index?: number;
  onReorder?: (from: number, before: number) => void;
  onMouseUp?: (event: DeckCardMouseUpEvent) => void;
  onMouseEnter?: () => void;
  onDoubleClick?: (card: CardMeta) => void;
  is408?: boolean;
  banlistHash?: number | null;
}> = memo(
  ({
    value,
    source,
    index,
    onReorder,
    onMouseUp,
    onMouseEnter,
    onDoubleClick,
    is408,
    banlistHash,
  }) => {
    const {
      environment: editorEnvironment,
      selected,
      revision,
    } = useSnapshot(banlistStore);
    const environment = is408 ? "408" : editorEnvironment;
    const selectedKey = selected[environment];
    const limitCnt = useMemo(() => {
      if (banlistHash === null) return undefined;
      if (banlistHash !== undefined)
        return (
          forbidden.get(value, banlistHash) ??
          forbidden_408.get(value, banlistHash)
        );
      return (environment === "408" ? forbidden_408 : forbidden).get(
        value,
        undefined,
        environment,
      );
    }, [value, environment, banlistHash, selectedKey, revision]);
    const text = value.text;
    const ref = useRef<HTMLDivElement>(null);
    // 浏览器在拖放结束后仍可能派发 mouseup，记录是否拖动以免误触详情。
    const dragged = useRef(false);
    const [{ isDragging }, drag] = useDrag<
      DeckCardDragItem,
      unknown,
      { isDragging: boolean }
    >({
      type: "Card",
      item: () => {
        dragged.current = true;
        return { value, source, index };
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });
    // 悬停只显示插入位置，真正放下后再改卡组，取消拖动不会改变顺序。
    const [dropAfter, setDropAfter] = useState(false);
    const [{ showInsertion }, drop] = useDrop<
      DeckCardDragItem,
      unknown,
      { showInsertion: boolean }
    >({
      accept: "Card",
      canDrop: (item) =>
        // 单张卡片只处理本区域排序，跨区域移动交给外层 DeckZone。
        !!onReorder &&
        item.source === source &&
        item.index !== undefined &&
        index !== undefined,
      hover: (_, monitor) => {
        const offset = monitor.getClientOffset();
        const rect = ref.current?.getBoundingClientRect();
        if (monitor.canDrop() && offset && rect) {
          // 以卡片左右半区决定插到前面还是后面，换行后仍使用相同规则。
          setDropAfter(offset.x > rect.left + rect.width / 2);
        }
      },
      drop: (item, monitor) => {
        const offset = monitor.getClientOffset();
        const rect = ref.current?.getBoundingClientRect();
        const after = offset && rect && offset.x > rect.left + rect.width / 2;
        if (item.index !== undefined && index !== undefined) {
          onReorder?.(item.index, index + Number(!!after));
        }
      },
      collect: (monitor) => ({
        showInsertion:
          monitor.isOver({ shallow: true }) &&
          monitor.canDrop() &&
          monitor.getItem()?.index !== index,
      }),
    });
    // 同一节点同时作为拖动来源和排序目标，保持卡片布局不变。
    drag(drop(ref));
    const [loadedCode, setLoadedCode] = useState<number | null>(null);

    return (
      <div
        className={styles.card}
        ref={ref}
        data-testid="deck-card"
        data-card-code={value.id}
        data-card-source={source}
        data-card-index={index}
        data-drop-position={
          showInsertion ? (dropAfter ? "after" : "before") : undefined
        }
        style={{ opacity: isDragging && source !== "search" ? 0.35 : 1 }}
        onMouseDown={() => (dragged.current = false)}
        onTouchStart={() => (dragged.current = false)}
        onMouseUp={(event) => {
          if (dragged.current || isDragging) return;
          onMouseUp?.({
            event,
            card: value,
            index,
          });
        }}
        onMouseEnter={onMouseEnter}
        onDoubleClick={() => onDoubleClick?.(value)}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        {loadedCode !== value.id && (
          <div className={styles.cardname}>{text.name}</div>
        )}
        <YgoCard
          className={styles.cardcover}
          code={value.id}
          loading={source === "search" ? "lazy" : "eager"}
          onLoad={() => setLoadedCode(value.id)}
          onError={() => setLoadedCode(null)}
        />
        {limitCnt !== undefined && (
          <img
            className={styles.cardlimit}
            src={`${assetsPath}/Limit0${limitCnt}.png`}
            draggable={false}
          />
        )}
      </div>
    );
  },
);
