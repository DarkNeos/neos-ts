import { Drawer, Space } from "antd";
import React from "react";
import { proxy, useSnapshot } from "valtio";

import { getCardDisplayName, ygopro } from "@/api";
import { isGraveInspectionBlocked } from "@/api/duelHints";
import { cardStore, CardType, matStore } from "@/stores";
import { registerDuelDialogReset } from "@/stores/duelDialogs";
import { YgoCard } from "@/ui/Shared";

import { cancelOnRightClick } from "../../cancelOnRightClick";
import { CardHints } from "../CardHints";
import { showCardModal } from "../CardModal";
import styles from "./index.module.scss";

const CARD_WIDTH = "6.25rem";
const DRAWER_WIDTH = "10rem";

// TODO: 显示的位置还需要细细斟酌

const defaultStore = {
  zone: ygopro.CardZone.HAND,
  controller: 0,
  monster: {} as CardType,
  isOpen: false,
  isZone: true,
};

const store = proxy({ ...defaultStore });
registerDuelDialogReset(() => Object.assign(store, defaultStore));

export const CardListModal = () => {
  const { zone, monster, isOpen, isZone, controller } = useSnapshot(store);
  const { inner } = useSnapshot(cardStore);
  const duelState = useSnapshot(matStore);
  const graveBlocked = isGraveInspectionBlocked(
    { zone, controller },
    duelState,
  );
  let cardList: readonly CardType[] = [];

  if (isZone) {
    const zoneCards = (inner as readonly CardType[]).filter(
      (card) =>
        card.location.zone === zone &&
        card.location.controller === controller &&
        !card.location.is_overlay,
    );
    // 与 MDPRO3 一致：墓地从上到下展示序号由大到小的卡片。
    if (zone === ygopro.CardZone.GRAVE)
      zoneCards.sort((a, b) => b.location.sequence - a.location.sequence);
    cardList = zoneCards;
  } else {
    // 看超量素材
    cardList = (inner as readonly CardType[]).filter(
      (card) =>
        card.location.zone === monster.location.zone &&
        card.location.controller === monster.location.controller &&
        card.location.sequence === monster.location.sequence &&
        card.location.is_overlay,
    );
  }

  const handleOkOrCancel = () => {
    store.isOpen = false;
  };

  return (
    <Drawer
      rootClassName={`duel-side-drawer duel-translucent-drawer ${styles.drawer}`}
      data-testid="duel-card-list-drawer"
      open={isOpen}
      onClose={handleOkOrCancel}
      drawerRender={(node) => (
        <div
          style={{ display: "contents" }}
          onContextMenu={cancelOnRightClick(handleOkOrCancel)}
        >
          {node}
        </div>
      )}
      // headerStyle={{ display: "none" }}
      width={DRAWER_WIDTH}
      style={{ maxHeight: "100%" }}
      mask={false}
    >
      {graveBlocked ? (
        <p data-testid="grave-inspection-blocked">暂不能查看自己的墓地</p>
      ) : (
        <Space direction="vertical">
          {cardList.map((card) => {
            const { name, renamed } = getCardDisplayName(
              card.meta,
              card.originalData,
            );
            return (
              <button
                key={card.uuid}
                type="button"
                className={styles.card}
                data-testid="duel-card-list-entry"
                data-card-uuid={card.uuid}
                onClick={() => showCardModal(card)}
              >
                <YgoCard
                  code={card.code}
                  targeted={card.targeted}
                  width={CARD_WIDTH}
                />
                {card.code > 0 && (
                  <>
                    <span className={styles.name}>{card.meta.text.name}</span>
                    {renamed && (
                      <span className={styles.renamed}>({name})</span>
                    )}
                    <CardHints card={card as CardType} showSummonStatus />
                  </>
                )}
              </button>
            );
          })}
        </Space>
      )}
    </Drawer>
  );
};

export const displayCardListModal = ({
  isZone,
  monster,
  zone,
  controller,
}: Partial<Omit<typeof defaultStore, "isOpen">>) => {
  store.isOpen = true;
  store.isZone = isZone ?? false;
  monster && (store.monster = monster);
  zone !== undefined && (store.zone = zone);
  controller !== undefined && (store.controller = controller);
};
