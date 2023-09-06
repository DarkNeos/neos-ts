import { CheckOutlined, UndoOutlined } from "@ant-design/icons";
import { App, Button, Space } from "antd";
import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { CardMeta, fetchCard, sendUpdateDeck } from "@/api";
import { isExtraDeckCard } from "@/common";
import { IDeck, roomStore, SideStage, sideStore } from "@/stores";

import { CardDetail } from "../BuildDeck/CardDetail";
import { Background, DeckZone, ScrollableArea, Type } from "../Shared";
import { Chat } from "../WaitRoom/Chat";
import styles from "./index.module.scss";
import { TpModal } from "./TpModal";

export const Component: React.FC = () => {
  const { message } = App.useApp();
  const { deck: sideDeck } = sideStore;
  const { stage } = useSnapshot(sideStore);
  const { errorMsg } = useSnapshot(roomStore);
  const initialDeck = JSON.parse(JSON.stringify(sideDeck));
  const [deck, setDeck] = useState<IDeck>(initialDeck);
  const [selectedCard, setSelectedCard] = useState(0);
  const navigate = useNavigate();
  const canAdd = (card: CardMeta, type: Type, _source: Type | "search") => {
    const cardType = card.data.type ?? 0;
    if (
      (type === "extra" && !isExtraDeckCard(cardType)) ||
      (type === "main" && isExtraDeckCard(cardType))
    ) {
      return { result: false, reason: "卡片种类不符合" };
    } else {
      return { result: true, reason: "" };
    }
  };
  const onChange = (
    card: CardMeta,
    source: Type | "search",
    destination: Type,
  ) => {
    setDeck((prev) => {
      const deck = { ...prev };
      if (source !== "search") {
        const removeIndex = deck[source].findIndex((id) => id === card.id);
        if (removeIndex !== -1) {
          deck[source].splice(removeIndex, 1);
        }
      }
      deck[destination].push(card.id);

      return deck;
    });
  };
  const onReset = () => {
    setDeck(JSON.parse(JSON.stringify(sideDeck)));
    message.info("重置成功");
  };
  const onSummit = () => sendUpdateDeck(deck);

  useEffect(() => {
    if (stage === SideStage.SIDE_CHANGED) {
      message.info("副卡组更换成功，请耐心等待其他玩家更换卡组");
    }
    if (stage === SideStage.DUEL_START) {
      // 决斗开始，跳转
      navigate("/duel");
    }
  }, [stage]);
  useEffect(() => {
    if (errorMsg !== undefined && errorMsg !== "") {
      message.error(errorMsg);
      roomStore.errorMsg = undefined;
    }
  }, [errorMsg]);

  return (
    <DndProvider backend={HTML5Backend}>
      <Background />
      <div className={styles.container}>
        <div className={styles.sider}>
          <Chat />
        </div>
        <div className={styles.content}>
          <div className={styles["deck-container"]}>
            <Space className={styles.title}>
              <div>请拖动更换副卡组</div>
              <Space style={{ marginRight: 6 }}>
                <Button
                  type="text"
                  size="small"
                  icon={<UndoOutlined />}
                  onClick={onReset}
                >
                  重置
                </Button>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  disabled={stage > SideStage.SIDE_CHANGING}
                  onClick={onSummit}
                >
                  确定
                </Button>
              </Space>
            </Space>
            <ScrollableArea className={styles["deck-zone"]}>
              {(["main", "extra", "side"] as const).map((type) => (
                <DeckZone
                  key={type}
                  type={type}
                  cards={[...deck[type]].map((id) => fetchCard(id))}
                  canAdd={canAdd}
                  onChange={onChange}
                  onElementMouseUp={(event) => setSelectedCard(event.card.id)}
                />
              ))}
            </ScrollableArea>
          </div>
        </div>
        <div className={styles["detail-container"]}>
          <CardDetail code={selectedCard} open={true} onClose={() => {}} />
        </div>
      </div>
      <TpModal />
    </DndProvider>
  );
};
