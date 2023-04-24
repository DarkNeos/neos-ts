import { Button, Drawer, List } from "antd";
import React from "react";

import { sendSelectIdleCmdResponse } from "@/api/ocgcore/ocgHelper";
import { useConfig } from "@/config";
import { useAppSelector } from "@/hook";
import {
  clearAllIdleInteractivities,
  setCardListModalIsOpen,
} from "@/reducers/duel/mod";
import {
  selectCardListModalInfo,
  selectCardListModalIsOpen,
} from "@/reducers/duel/modal/mod";
import { store } from "@/store";

import {
  messageStore,
  clearAllIdleInteractivities as FIXME_clearAllIdleInteractivities,
} from "@/valtioStores";
import { useSnapshot } from "valtio";

const NeosConfig = useConfig();

const CARD_WIDTH = 100;

const { cardListModal } = messageStore;

export const CardListModal = () => {
  const dispatch = store.dispatch;
  // const isOpen = useAppSelector(selectCardListModalIsOpen);
  // const list = useAppSelector(selectCardListModalInfo);

  const snapCardListModal = useSnapshot(cardListModal);
  const isOpen = snapCardListModal.isOpen;
  const list = snapCardListModal.list;

  const handleOkOrCancel = () => {
    dispatch(setCardListModalIsOpen(false));
    cardListModal.isOpen = false;
  };

  return (
    <Drawer open={isOpen} onClose={handleOkOrCancel}>
      <List
        itemLayout="horizontal"
        // @ts-ignore 报错是因为类型不可变，实际上是没问题的
        dataSource={list}
        renderItem={(item) => (
          <List.Item
            actions={item.interactivies.map((interactivy, idx) => (
              <Button
                key={idx}
                onClick={() => {
                  sendSelectIdleCmdResponse(interactivy.response);
                  dispatch(setCardListModalIsOpen(false));
                  dispatch(clearAllIdleInteractivities(0));
                  dispatch(clearAllIdleInteractivities(1));

                  cardListModal.isOpen = false;
                  FIXME_clearAllIdleInteractivities(0);
                  FIXME_clearAllIdleInteractivities(1);
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
