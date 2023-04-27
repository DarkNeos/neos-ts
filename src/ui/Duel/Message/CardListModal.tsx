import { Button, Drawer, List } from "antd";
import React from "react";
import { useSnapshot } from "valtio";

import { sendSelectIdleCmdResponse } from "@/api";
import { useConfig } from "@/config";
import {
  clearAllIdleInteractivities as clearAllIdleInteractivities,
  messageStore,
} from "@/stores";

const NeosConfig = useConfig();

const CARD_WIDTH = 100;

const { cardListModal } = messageStore;

export const CardListModal = () => {
  const snapCardListModal = useSnapshot(cardListModal);
  const isOpen = snapCardListModal.isOpen;
  const list = snapCardListModal.list as typeof cardListModal.list;

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
            actions={item.interactivies.map((interactivy, idx) => (
              <Button
                key={idx}
                onClick={() => {
                  sendSelectIdleCmdResponse(interactivy.response);
                  cardListModal.isOpen = false;
                  clearAllIdleInteractivities(0);
                  clearAllIdleInteractivities(1);
                }}
              >
                {interactivy.desc}
              </Button>
            ))}
            extra={
              <img
                alt={item.meta?.text.name}
                src={`${NeosConfig.cardImgUrl}/${item.meta?.id}.jpg`}
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
