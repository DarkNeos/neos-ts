import React from "react";
import { useAppSelector } from "../../hook";
import { store } from "../../store";
import {
  selectCardListModalIsOpen,
  selectCardListModalInfo,
} from "../../reducers/duel/modal/mod";
import {
  clearAllIdleInteractivities,
  setCardListModalIsOpen,
} from "../../reducers/duel/mod";
import { Modal, List, Button } from "antd";
import { sendSelectIdleCmdResponse } from "../../api/ocgcore/ocgHelper";

const CARD_WIDTH = 100;

const CardListModal = () => {
  const dispatch = store.dispatch;
  const isOpen = useAppSelector(selectCardListModalIsOpen);
  const list = useAppSelector(selectCardListModalInfo);

  const handleOkOrCancel = () => {
    dispatch(setCardListModalIsOpen(false));
  };

  return (
    <Modal open={isOpen} onOk={handleOkOrCancel} onCancel={handleOkOrCancel}>
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
                alt={item.name}
                src={item.imgUrl}
                style={{ width: CARD_WIDTH }}
              />
            }
          >
            <List.Item.Meta title={item.name} description={item.desc} />
          </List.Item>
        )}
      ></List>
    </Modal>
  );
};

export default CardListModal;
