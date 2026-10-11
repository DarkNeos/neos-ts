import { App } from "antd";
import classNames from "classnames";
import React, { useState } from "react";
import { useDrop } from "react-dnd";

import { CardMeta } from "@/api";

import { DeckCard, DeckCardDragItem, DeckCardMouseUpEvent } from "../DeckCard";
import styles from "./index.module.scss";

/** 正在组卡的zone，包括main/extra/side
 * 该组件内部没有引用任何store，是解耦的*/
export type Type = "main" | "extra" | "side";
export const DeckZone: React.FC<{
  type: Type;
  cards: CardMeta[];
  canAdd: (
    card: CardMeta,
    type: Type,
    source: Type | "search",
  ) => { result: boolean; reason: string };
  onChange: (
    card: CardMeta,
    source: Type | "search",
    destination: Type,
    sourceIndex?: number,
  ) => void;
  /** 同区域排序回调；插入位置以移动前的数组为准，末尾为 cards.length。 */
  onReorder?: (from: number, before: number) => void;
  onElementMouseUp: (event: DeckCardMouseUpEvent) => void;
  onDoubleClick?: (card: CardMeta) => void;
  is408?: boolean;
  banlistHash?: number | null;
}> = ({
  type,
  cards,
  canAdd,
  onChange,
  onReorder,
  onElementMouseUp: onElementMouseUp,
  onDoubleClick,
  is408,
  banlistHash,
}) => {
  const { message } = App.useApp();
  const [allowToDrop, setAllowToDrop] = useState(false);
  const [{ isOver }, dropRef] = useDrop<
    DeckCardDragItem,
    unknown,
    { isOver: boolean }
  >({
    accept: ["Card"], // 指明该区域允许接收的拖放物。可以是单个，也可以是数组
    // 里面的值就是useDrag所定义的type
    // 当拖拽物在这个拖放区域放下时触发,这个item就是拖拽物的item（拖拽物携带的数据）
    drop: ({ value, source, index }, monitor) => {
      // 内层卡片已处理排序时不再执行区域回调，避免同一次放下移动两次。
      if (monitor.didDrop()) return;
      if (type === source) {
        // 放到区域空白处表示移至末尾，排序不需要重新校验添加数量上限。
        if (index !== undefined) onReorder?.(index, cards.length);
        return;
      }
      const { result, reason } = canAdd(value, type, source);
      if (result) {
        onChange(value, source, type, index);
      } else {
        message.error(reason);
      }
    },
    hover: ({ value, source }) => {
      setAllowToDrop(
        type !== source ? canAdd(value, type, source).result : true,
      );
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });
  // 卡片节点按位置复用，value 更新显示内容，index 区分同名副本。
  return (
    <div
      className={classNames(styles[type], {
        [styles.over]: isOver,
        [styles["not-allow-to-drop"]]: isOver && !allowToDrop,
      })}
      ref={dropRef}
      data-testid="deck-zone"
      data-deck-zone={type}
    >
      <div className={styles["card-continer"]}>
        {cards.map((card, i) => (
          <DeckCard
            value={card}
            key={`${type}-${i}`}
            source={type}
            index={i}
            onReorder={onReorder}
            onMouseUp={onElementMouseUp}
            onDoubleClick={onDoubleClick}
            is408={is408}
            banlistHash={banlistHash}
          />
        ))}
        <div className={styles["editing-zone-name"]}>
          {`${type.toUpperCase()}: ${cards.length}`}
        </div>
      </div>
    </div>
  );
};
