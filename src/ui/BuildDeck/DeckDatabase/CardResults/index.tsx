import { message, Pagination } from "antd";
import React, { memo, useEffect, useState } from "react";

import { CardMeta } from "@/api";
import { isExtraDeckCard } from "@/common";
import { DeckCard, DeckCardMouseUpEvent, IconFont } from "@/ui/Shared";

import { selectedCard } from "../..";
import { editDeckStore } from "../../store";
import styles from "./index.module.scss";

/** 搜索区的搜索结果，使用memo避免重复渲染 */
export const CardResults: React.FC<{
  results: CardMeta[];
  scrollToTop: () => void;
}> = memo(({ results, scrollToTop }) => {
  const itemsPerPage = 196; // 每页显示的数据数量
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = results.slice(startIndex, endIndex);

  const showSelectedCard = (card: CardMeta) => {
    selectedCard.id = card.id;
    selectedCard.open = true;
  };

  const handleAddCardToMain = (card: CardMeta) => {
    const cardType = card.data.type ?? 0;
    const isExtraCard = isExtraDeckCard(cardType);
    const type = isExtraCard ? "extra" : "main";
    const { result, reason } = editDeckStore.canAdd(card, type, "search");
    if (result) {
      editDeckStore.add(type, card);
    } else {
      message.error(reason);
    }
  };

  const handleAddCardToSide = (card: CardMeta) => {
    const { result, reason } = editDeckStore.canAdd(card, "side", "search");
    if (result) {
      editDeckStore.add("side", card);
    } else {
      message.error(reason);
    }
  };

  /** safari 不支持 onAuxClick，所以使用 mousedown 模拟 */
  const handleMouseUp = (payload: DeckCardMouseUpEvent) => {
    const { event, card } = payload;
    switch (event.button) {
      // 左键
      case 0:
        showSelectedCard(card);
        break;
      // 中键
      case 1:
        handleAddCardToSide(card);
        break;
      // 右键
      case 2:
        handleAddCardToMain(card);
        break;
      default:
        break;
    }
  };

  return (
    <>
      {results.length ? (
        <>
          <div className={styles["search-cards"]}>
            {currentData.map((card) => (
              <DeckCard
                value={card}
                key={card.id}
                source="search"
                onMouseUp={handleMouseUp}
                onMouseEnter={() => showSelectedCard(card)}
              />
            ))}
          </div>
          {results.length > itemsPerPage && (
            <div style={{ textAlign: "center", padding: "0.625rem 0 1.25rem" }}>
              <Pagination
                current={currentPage}
                onChange={(page) => {
                  setCurrentPage(page);
                  scrollToTop();
                }}
                total={results.length}
                pageSize={itemsPerPage}
                showSizeChanger={false}
                showLessItems
                hideOnSinglePage
              />
            </div>
          )}
        </>
      ) : (
        <div className={styles.empty}>
          <IconFont type="icon-empty" size={40} />
          <div>找不到相应卡片</div>
        </div>
      )}
    </>
  );
});
