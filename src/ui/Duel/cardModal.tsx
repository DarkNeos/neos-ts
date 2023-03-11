import React from "react";
import { useAppSelector } from "../../hook";
import { store } from "../../store";
import {
  selectCardModalIsOpen,
  selectCardModalInteractivies,
  selectCardModalMeta,
} from "../../reducers/duel/modal/mod";
import {
  setCardModalIsOpen,
  clearAllIdleInteractivities,
} from "../../reducers/duel/mod";
import { Modal, Card, Button, Row, Col } from "antd";
import { sendSelectIdleCmdResponse } from "../../api/ocgcore/ocgHelper";
import Icon from "@ant-design/icons";
import NeosConfig from "../../../neos.config.json";
import { ReactComponent as BattleSvg } from "../../../neos-assets/battle-axe.svg";
import { ReactComponent as DefenceSvg } from "../../../neos-assets/checked-shield.svg";

const { Meta } = Card;
const CARD_WIDTH = 240;

const CardModal = () => {
  const dispatch = store.dispatch;
  const isOpen = useAppSelector(selectCardModalIsOpen);
  const meta = useAppSelector(selectCardModalMeta);
  const name = meta?.text.name;
  const desc = meta?.text.desc;
  const atk = meta?.data.atk;
  const def = meta?.data.def;
  const imgUrl = meta?.id
    ? `${NeosConfig.cardImgUrl}/${meta.id}.jpg`
    : undefined;
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
        <p>
          <Row gutter={8}>
            {atk ? (
              <Col>
                <Icon component={BattleSvg} />
                <a>{atk}</a>
              </Col>
            ) : (
              <></>
            )}
            <Col>
              <div>/</div>
            </Col>
            {def ? (
              <Col>
                <Icon component={DefenceSvg} />
                <a>{def}</a>
              </Col>
            ) : (
              <></>
            )}
          </Row>
        </p>
      </Card>
      {interactivies.map((interactive, idx) => {
        return (
          <Button
            key={idx}
            onClick={() => {
              sendSelectIdleCmdResponse(interactive.response);
              dispatch(setCardModalIsOpen(false));
              dispatch(clearAllIdleInteractivities(0));
              dispatch(clearAllIdleInteractivities(1));
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
