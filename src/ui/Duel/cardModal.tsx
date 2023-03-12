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
import Icon, { StarOutlined } from "@ant-design/icons";
import NeosConfig from "../../../neos.config.json";
import { ReactComponent as BattleSvg } from "../../../neos-assets/battle-axe.svg";
import { ReactComponent as DefenceSvg } from "../../../neos-assets/checked-shield.svg";
import { Meta2StringCodeMap } from "../../common";

const { Meta } = Card;
const CARD_WIDTH = 240;

const CardModal = () => {
  const dispatch = store.dispatch;
  const isOpen = useAppSelector(selectCardModalIsOpen);
  const meta = useAppSelector(selectCardModalMeta);
  const name = meta?.text.name;
  const types = meta?.text.types;
  const race = meta?.data.race;
  const attribute = meta?.data.attribute;
  const level = meta?.data.level;
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
        <p>
          <AtkLine level={level} atk={atk} def={def} />
        </p>
        <p>
          <AttLine types={types} race={race} attribute={attribute} />
        </p>
        <p>{desc}</p>
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

const AtkLine = (props: { level?: number; atk?: number; def?: number }) => (
  <Row gutter={8}>
    {props.level ? (
      <Col>
        <StarOutlined />
        {props.level}
      </Col>
    ) : (
      <></>
    )}
    {props.atk ? (
      <Col>
        <Icon component={BattleSvg} />
        <a>{props.atk}</a>
      </Col>
    ) : (
      <></>
    )}
    <Col>
      <div>/</div>
    </Col>
    {props.def ? (
      <Col>
        <Icon component={DefenceSvg} />
        <a>{props.def}</a>
      </Col>
    ) : (
      <></>
    )}
  </Row>
);

const AttLine = (props: {
  types?: string;
  race?: number;
  attribute?: number;
}) => (
  <Row gutter={8}>
    {props.types ? <Col>{`[${props.types}]`}</Col> : <></>}
    {props.race ? <Col>{Meta2StringCodeMap.get(props.race)}</Col> : <></>}
    <Col>
      <div>/</div>
    </Col>
    {props.attribute ? (
      <Col>{Meta2StringCodeMap.get(props.attribute)}</Col>
    ) : (
      <></>
    )}
  </Row>
);
export default CardModal;
