import { ThunderboltOutlined } from "@ant-design/icons";
import { CheckCard, CheckCardProps } from "@ant-design/pro-components";
import { Button, Card, Col, Popover, Row } from "antd";
import React, { useState } from "react";
import { useSnapshot } from "valtio";

import {
  fetchStrings,
  sendSelectMultiResponse,
  sendSelectSingleResponse,
} from "@/api";
import { useConfig } from "@/config";
import { clearSelectActions, matStore, messageStore } from "@/stores";

import { DragModal } from "./DragModal";

const NeosConfig = useConfig();
const CANCEL_RESPONSE = -1;
const FINISH_RESPONSE = -1;

const { selectCardActions } = messageStore;

export const SelectActionsModal = () => {
  const snap = useSnapshot(selectCardActions);
  const isOpen = snap.isOpen;
  const isChain = snap.isChain;
  const min = snap.min ?? 0;
  const max = snap.max ?? 0;
  const single = snap.single ?? false;
  const selecteds = snap.selecteds;
  const selectables = snap.selectables;
  const mustSelects = snap.mustSelects;

  const [response, setResponse] = useState([]);
  const hint = useSnapshot(matStore.hint);
  const preHintMsg = hint?.esHint || "";
  const selectHintMsg = hint?.esSelectHint || "请选择卡片";

  const cancelable = snap.cancelAble;
  const finishable = snap.finishAble;
  const totalLevels = snap.totalLevels ?? 0;
  const overflow = snap.overflow || false;
  const LevelSum1 = mustSelects
    .concat(response)
    .map((option) => option.level1 || 0)
    .reduce((sum, current) => sum + current, 0);
  const LevelSum2 = mustSelects
    .concat(response)
    .map((option) => option.level2 || 0)
    .reduce((sum, current) => sum + current, 0);
  const levelMatched = overflow
    ? LevelSum1 >= totalLevels || LevelSum2 >= totalLevels
    : LevelSum1 == totalLevels || LevelSum2 == totalLevels;
  const submitable = single
    ? response.length == 1
    : response.length >= min && response.length <= max && levelMatched;

  return (
    <DragModal
      title={`${preHintMsg} ${selectHintMsg} ${min}-${max} ${
        single ? "每次选择一张" : ""
      }`}
      open={isOpen}
      closable={false}
      footer={
        <>
          <Button
            disabled={!submitable}
            onClick={() => {
              const values = mustSelects
                .concat(response)
                .map((option) => option.response);

              if (isChain) {
                sendSelectSingleResponse(values[0]);
              } else {
                sendSelectMultiResponse(values);
              }
              clearSelectActions();
            }}
            onFocus={() => {}}
            onBlur={() => {}}
          >
            {fetchStrings("!system", 1211)}
          </Button>
          <Button
            disabled={!finishable}
            onClick={() => {
              sendSelectSingleResponse(FINISH_RESPONSE);
              clearSelectActions();
            }}
            onFocus={() => {}}
            onBlur={() => {}}
          >
            {fetchStrings("!system", 1296)}
          </Button>

          <Button
            disabled={!cancelable}
            onClick={() => {
              sendSelectSingleResponse(CANCEL_RESPONSE);
              clearSelectActions();
            }}
            onFocus={() => {}}
            onBlur={() => {}}
          >
            {fetchStrings("!system", 1295)}
          </Button>
        </>
      }
      width={800}
    >
      <CheckCard.Group
        multiple
        bordered
        size="small"
        onChange={(value) => {
          // @ts-ignore
          setResponse(value);
        }}
      >
        <Row>
          {selectables.map((option, idx) => {
            return (
              <Col span={4} key={idx}>
                <HoverCheckCard
                  hoverContent={option.effectDesc}
                  style={{ width: 120 }}
                  cover={
                    <img
                      alt={option.code.toString()}
                      src={
                        option.code
                          ? `${NeosConfig.cardImgUrl}/${option.code}.jpg`
                          : `${NeosConfig.assetsPath}/card_back.jpg`
                      }
                      style={{ width: 100 }}
                    />
                  }
                  value={option}
                />
              </Col>
            );
          })}
        </Row>
        <p>{fetchStrings("!system", 212)}</p>
        <Row>
          {selecteds.concat(mustSelects).map((option, idx) => {
            return (
              <Col span={4} key={idx}>
                <Card
                  style={{ width: 120 }}
                  cover={
                    <img
                      alt={option.code.toString()}
                      src={
                        option.code
                          ? `${NeosConfig.cardImgUrl}/${option.code}.jpg`
                          : `${NeosConfig.assetsPath}/card_back.jpg`
                      }
                    />
                  }
                />
              </Col>
            );
          })}
        </Row>
      </CheckCard.Group>
    </DragModal>
  );
};

const HoverCheckCard = (props: CheckCardProps & { hoverContent?: string }) => {
  const [hover, setHover] = useState(false);

  const onMouseEnter = () => setHover(true);
  const onMouseLeave = () => setHover(false);

  return (
    <>
      <CheckCard {...props} />
      {props.hoverContent ? (
        <Popover content={<p>{props.hoverContent}</p>} open={hover}>
          <Button
            icon={<ThunderboltOutlined />}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          ></Button>
        </Popover>
      ) : (
        <></>
      )}
    </>
  );
};
