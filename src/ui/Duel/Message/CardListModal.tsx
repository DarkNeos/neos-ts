import { Drawer, Space } from "antd";
import React from "react";
import { proxy, useSnapshot } from "valtio";

import { ygopro } from "@/api";
import { cardStore, CardType } from "@/stores";
import { YgoCard } from "@/ui/Shared";

import { showCardModal } from "./CardModal";

const CARD_WIDTH = 100;

// TODO: 显示的位置还需要细细斟酌

const defaultStore = {
  zone: ygopro.CardZone.HAND,
  controller: 0,
  monster: {} as CardType,
  isOpen: false,
  isZone: true,
};

const store = proxy(defaultStore);

export const CardListModal = () => {
  const { zone, monster, isOpen, isZone, controller } = useSnapshot(store);
  let cardList: CardType[] = [];

  if (isZone) {
    cardList = cardStore.at(zone, controller);
  } else {
    // 看超量素材
    cardList = cardStore.findOverlay(
      monster.location.zone,
      monster.location.controller,
      monster.location.sequence
    );
  }

  const handleOkOrCancel = () => {
    store.isOpen = false;
  };

  return (
    <Drawer
      open={isOpen}
      onClose={handleOkOrCancel}
      // headerStyle={{ display: "none" }}
      width={CARD_WIDTH + 66}
      style={{ maxHeight: "100%" }}
      mask={false}
    >
      <Space direction="vertical">
        {cardList.map((card) => (
          <YgoCard
            code={card.code}
            key={card.uuid}
            width={CARD_WIDTH}
            onClick={() => showCardModal(card)}
          />
        ))}
      </Space>
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
  isZone && (store.isZone = isZone);
  monster && (store.monster = monster);
  zone && (store.zone = zone);
  controller && (store.controller = controller);
};
