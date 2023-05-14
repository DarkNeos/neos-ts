import { Drawer, List } from "antd";
import React from "react";
import { useSnapshot } from "valtio";

import { useConfig } from "@/config";
import { messageStore } from "@/stores";

import { EffectButton } from "./EffectButton";

const NeosConfig = useConfig();

const CARD_WIDTH = 100;

const { cardListModal } = messageStore;

export const CardListModal = () => {
  const snap = useSnapshot(cardListModal);
  const isOpen = snap.isOpen;
  const list = snap.list as typeof cardListModal.list;

  const handleOkOrCancel = () => {
    cardListModal.isOpen = false;
  };

  return (
    <Drawer open={isOpen} onClose={handleOkOrCancel}>
      <List
        itemLayout="horizontal"
        dataSource={list}
        renderItem={(item) => (
          <List.Item
            actions={[
              <EffectButton
                effectInteractivies={item.interactivies}
                meta={item.meta}
              />,
            ]}
            extra={
              <img
                alt={item.meta?.text.name}
                src={
                  item.meta?.id
                    ? `${NeosConfig.cardImgUrl}/${item.meta.id}.jpg`
                    : `${NeosConfig.assetsPath}/card_back.jpg`
                }
                style={{ width: CARD_WIDTH }}
              />
            }
          >
            <List.Item.Meta
              title={item.meta?.text.name}
              description={item.meta?.text.desc}
            />
          </List.Item>
        )}
      ></List>
    </Drawer>
  );
};
