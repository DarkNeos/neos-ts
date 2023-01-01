import React from "react";
import { useAppSelector } from "../../hook";
import { store } from "../../store";
import {
  selectCardModalIsOpen,
  selectCardModalName,
  selectCardModalDesc,
  selectCardModalImgUrl,
  selectCardModalInteractivies,
} from "../../reducers/duel/modalSlice";
import {
  setCardModalIsOpen,
  clearHandsInteractivity,
} from "../../reducers/duel/mod";
import { Modal, Card, Button } from "antd";
import { sendSelectIdleCmdResponse } from "../../api/ocgcore/ocgHelper";

const { Meta } = Card;
const CARD_WIDTH = 240;

const CardModal = () => {
  const dispatch = store.dispatch;
  const isOpen = useAppSelector(selectCardModalIsOpen);
  const name = useAppSelector(selectCardModalName);
  const desc = useAppSelector(selectCardModalDesc);
  const imgUrl = useAppSelector(selectCardModalImgUrl);
  const interactivies = useAppSelector(selectCardModalInteractivies);

  const handleOkOrCancel = () => {
    dispatch(setCardModalIsOpen(false));
  };

  return (
    <Modal open={isOpen} onOk={handleOkOrCancel} onCancel={handleOkOrCancel}>
      <Card
        hoverable
        style={{ width: CARD_WIDTH }}
        cover={<img alt={name} src={imgUrl} />}
      >
        <Meta title={name} />
        <p>{desc}</p>
      </Card>
      {interactivies.map((interactive, idx) => {
        return (
          <Button
            key={idx}
            onClick={() => {
              sendSelectIdleCmdResponse(interactive.response);
              dispatch(setCardModalIsOpen(false));
              dispatch(clearHandsInteractivity(0));
            }}
          >
            {interactive.desc}
          </Button>
        );
      })}
    </Modal>
  );
};

export default CardModal;
