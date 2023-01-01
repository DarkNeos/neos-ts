import React from "react";
import { useAppSelector } from "../../hook";
import { store } from "../../store";
import {
  selectCardListModalIsOpen,
  selectCardListModalInfo,
} from "../../reducers/duel/modalSlice";
import { setCardListModalIsOpen } from "../../reducers/duel/mod";
import { Modal, List, Popover, Card } from "antd";

const { Meta } = Card;
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
          <Popover
            content={
              <Card
                hoverable
                style={{ width: CARD_WIDTH }}
                cover={<img alt={item.name} src={item.imgUrl} />}
              >
                <Meta title={item.name} />
                <p>{item.desc}</p>
              </Card>
            }
          >
            <List.Item>
              <List.Item.Meta title={item.name} description={item.desc} />
            </List.Item>
          </Popover>
        )}
      ></List>
    </Modal>
  );
};

export default CardListModal;
