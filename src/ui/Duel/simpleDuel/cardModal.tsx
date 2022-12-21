import React from "react";
import { useAppSelector } from "../../../hook";
import { store } from "../../../store";
import {
  selectCardModalIsOpen,
  selectCardModalName,
  selectCardModalDesc,
  selectCardModalImgUrl,
} from "../../../reducers/duel/modal";
import { setCardModalIsOpen } from "../../../reducers/duel/mod";
import { Modal, Card } from "antd";

const { Meta } = Card;
const CARD_WIDTH = 240;

const CardModal = () => {
  const dispatch = store.dispatch;
  const isOpen = useAppSelector(selectCardModalIsOpen);
  const name = useAppSelector(selectCardModalName);
  const desc = useAppSelector(selectCardModalDesc);
  const imgUrl = useAppSelector(selectCardModalImgUrl);

  const handleOkOrCancel = () => {
    dispatch(setCardModalIsOpen(false));
  };

  return (
    <>
      <Modal open={isOpen} onOk={handleOkOrCancel} onCancel={handleOkOrCancel}>
        <Card
          hoverable
          style={{ width: CARD_WIDTH }}
          cover={<img alt={name} src={imgUrl} />}
        >
          <Meta title={name} />
          <p>{desc}</p>
        </Card>
      </Modal>
    </>
  );
};

export default CardModal;
