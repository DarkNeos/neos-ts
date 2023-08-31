import React, { memo, useRef, useState } from "react";
import { useDrag } from "react-dnd";

import { CardMeta, forbidden } from "@/api";
import { useConfig } from "@/config";

import { Type } from "../DeckZone";
import { YgoCard } from "../YgoCard";
import styles from "./index.module.scss";

const { assetsPath } = useConfig();

/** 组卡页和Side页使用的单张卡片，增加了文字和禁限数量 */
export const DeckCard: React.FC<{
  value: CardMeta;
  source: Type | "search";
  onRightClick?: () => void;
  onClick?: () => void;
}> = memo(({ value, source, onRightClick, onClick }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: "Card",
    item: { value, source },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  drag(ref);
  const [showText, setShowText] = useState(true);
  const limitCnt = forbidden.get(value.id);
  return (
    <div
      className={styles.card}
      ref={ref}
      style={{ opacity: isDragging && source !== "search" ? 0 : 1 }}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onRightClick?.();
      }}
    >
      {showText && <div className={styles.cardname}>{value.text.name}</div>}
      <YgoCard
        className={styles.cardcover}
        code={value.id}
        onLoad={() => setShowText(false)}
      />
      {limitCnt !== undefined && (
        <img
          className={styles.cardlimit}
          src={`${assetsPath}/Limit0${limitCnt}.png`}
        />
      )}
    </div>
  );
});
