import { Button } from "antd";
import { useEffect } from "react";
import { proxy, useSnapshot } from "valtio";

import type { CardType } from "@/stores";
import { createDuelDialog } from "@/stores/duelDialogs";
import { ScrollableArea, YgoCard } from "@/ui/Shared";

import { showCardModal } from "../CardModal";
import { NeosModal } from "../NeosModal";
import styles from "./index.module.scss";

const state = proxy({ isOpen: false, cards: [] as CardType[] });
const dialog = createDuelDialog(() => {
  state.isOpen = false;
  state.cards = [];
}, undefined);

export const ConfirmCardsModal = () => {
  const { isOpen, cards } = useSnapshot(state);
  useEffect(() => () => dialog.finish(), []);

  return (
    <NeosModal
      movable
      title={`确认卡片：${cards.length} 张`}
      open={isOpen}
      width="38.25rem"
      closable={false}
      keyboard={false}
      footer={
        <Button
          type="primary"
          data-testid="duel-confirm-cards-finish"
          onClick={() => dialog.finish()}
        >
          完成
        </Button>
      }
    >
      <ScrollableArea maxHeight="50vh">
        <div className={styles.cards} data-testid="duel-confirm-cards-modal">
          {cards.map((card) => (
            <button
              type="button"
              key={card.uuid}
              className={styles.card}
              data-testid="duel-confirm-card"
              data-card-code={card.meta.id}
              aria-label={card.meta.text.name || `卡片 ${card.meta.id}`}
              onClick={() => showCardModal(card)}
            >
              <YgoCard code={card.meta.id} />
            </button>
          ))}
        </div>
      </ScrollableArea>
    </NeosModal>
  );
};

export const displayConfirmCardsModal = (cards: CardType[]) => {
  dialog.finish();
  state.cards = cards;
  state.isOpen = true;
  return dialog.wait();
};
