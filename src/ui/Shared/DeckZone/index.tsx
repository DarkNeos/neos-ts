import { App } from "antd";
import classNames from "classnames";
import React, { useState } from "react";
import { useDrop } from "react-dnd";

import { CardMeta } from "@/api";

import { DeckCard } from "../DeckCard";
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
  ) => void;
  onElementClick: (card: CardMeta) => void;
  onElementRightClick?: (card: CardMeta) => void;
}> = ({
  type,
  cards,
  canAdd,
  onChange,
  onElementClick,
  onElementRightClick,
}) => {
  const { message } = App.useApp();
  const [allowToDrop, setAllowToDrop] = useState(false);
  const [{ isOver }, dropRef] = useDrop({
    accept: ["Card"], // 指明该区域允许接收的拖放物。可以是单个，也可以是数组
    // 里面的值就是useDrag所定义的type
    // 当拖拽物在这个拖放区域放下时触发,这个item就是拖拽物的item（拖拽物携带的数据）
    drop: ({ value, source }: { value: CardMeta; source: Type | "search" }) => {
      if (type === source) return;
      const { result, reason } = canAdd(value, type, source);
      if (result) {
        onChange(value, source, type);
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
  return (
    <div
      className={classNames(styles[type], {
        [styles.over]: isOver,
        [styles["not-allow-to-drop"]]: isOver && !allowToDrop,
      })}
      ref={dropRef}
    >
      <div className={styles["card-continer"]}>
        {cards.map((card, i) => (
          <DeckCard
            value={card}
            key={card.id + i + type}
            source={type}
            onClick={() => {
              onElementClick(card);
            }}
            onRightClick={() => {
              onElementRightClick?.(card);
            }}
          />
        ))}
        <div className={styles["editing-zone-name"]}>
          {`${type.toUpperCase()}: ${cards.length}`}
        </div>
      </div>
    </div>
  );
};
