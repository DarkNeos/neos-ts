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
import {
  extraCardTypes,
  Type2StringCodeMap,
  Attribute2StringCodeMap,
  Race2StringCodeMap,
} from "../../common";
import { fetchStrings } from "../../api/strings";

const { Meta } = Card;
const CARD_WIDTH = 240;

const CardModal = () => {
  const dispatch = store.dispatch;
  const isOpen = useAppSelector(selectCardModalIsOpen);
  const meta = useAppSelector(selectCardModalMeta);
  const name = meta?.text.name;
  const types = meta?.data.type;
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
          <AttLine
            types={extraCardTypes(types || 0)}
            race={race}
            attribute={attribute}
          />
        </p>
        <p>
          <AtkLine level={level} atk={atk} def={def} />
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
    <Col>/</Col>
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
  types: number[];
  race?: number;
  attribute?: number;
}) => {
  const race = props.race
    ? fetchStrings("!system", Race2StringCodeMap.get(props.race) || 0)
    : undefined;
  const attribute = props.attribute
    ? fetchStrings("!system", Attribute2StringCodeMap.get(props.attribute) || 0)
    : undefined;
  const types = props.types
    .map((t) => fetchStrings("!system", Type2StringCodeMap.get(t) || 0))
    .join("|");
  return (
    <Row gutter={8}>
      <Col>{`[${types}]`}</Col>
      {race ? <Col>{race}</Col> : <></>}
      <Col>/</Col>
      {attribute ? <Col>{attribute}</Col> : <></>}
    </Row>
  );
};

export default CardModal;
