import React from "react";
import { useAppSelector } from "@/hook";
import { store } from "@/store";
import {
  selectCardListModalIsOpen,
  selectCardListModalInfo,
} from "@/reducers/duel/modal/mod";
import {
  clearAllIdleInteractivities,
  setCardListModalIsOpen,
} from "@/reducers/duel/mod";
import { Drawer, List, Button } from "antd";
import { sendSelectIdleCmdResponse } from "@/api/ocgcore/ocgHelper";
import NeosConfig from "../../../../neos.config.json";

const CARD_WIDTH = 100;

const CardListModal = () => {
  const dispatch = store.dispatch;
  const isOpen = useAppSelector(selectCardListModalIsOpen);
  const list = useAppSelector(selectCardListModalInfo);

  const handleOkOrCancel = () => {
    dispatch(setCardListModalIsOpen(false));
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
                  dispatch(setCardListModalIsOpen(false));
                  dispatch(clearAllIdleInteractivities(0));
                  dispatch(clearAllIdleInteractivities(1));
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

export default CardListModal;
