import { ThunderboltOutlined } from "@ant-design/icons";
import { CheckCard, CheckCardProps } from "@ant-design/pro-components";
import { Button, Col, Popover, Row } from "antd";
import React, { useState } from "react";
import { useSnapshot } from "valtio";

import { fetchStrings, sendSelectCardResponse } from "@/api";
import { useConfig } from "@/config";
import { matStore, messageStore } from "@/stores";

import { DragModal } from "./DragModal";

const NeosConfig = useConfig();
const CANCEL_RESPONSE = -1;
const FINISH_RESPONSE = -1;

const { selectCardActions } = messageStore;

export const CheckCardModal = () => {
  const snap = useSnapshot(selectCardActions);
  const isOpen = snap.isOpen;
  const min = snap.min ?? 0;
  const max = snap.max ?? 10;
  const selecteds = snap.selecteds;
  const selectables = snap.selectables;
  const mustSelects = snap.mustSelects;

  const [response, setResponse] = useState([]);
  const hint = useSnapshot(matStore.hint);
  const preHintMsg = hint?.esHint || "";
  const selectHintMsg = hint?.esSelectHint || "请选择卡片";

  const cancelable = snap.cancelAble;
  const finishable = snap.finishAble;
  const totalLevels = snap.totalLevels || 0;
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
  const submitable =
    response.length >= min && response.length <= max && levelMatched;

  const resetCheckCardModal = () => {
    selectCardActions.isOpen = false;
    selectCardActions.min = undefined;
    selectCardActions.max = undefined;
    selectCardActions.cancelAble = false;
    selectCardActions.totalLevels = undefined;
    selectCardActions.selecteds = [];
    selectCardActions.selectables = [];
    selectCardActions.finishAble = false;
    selectCardActions.overflow = false;
  };

  return (
    <DragModal
      title={`${preHintMsg} ${selectHintMsg} ${min}-${max}`}
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
              sendSelectCardResponse(values);
              resetCheckCardModal();
            }}
            onFocus={() => {}}
            onBlur={() => {}}
          >
            {fetchStrings("!system", 1211)}
          </Button>
          <Button
            disabled={!finishable}
            onClick={() => {
              sendSelectCardResponse([FINISH_RESPONSE]);
              resetCheckCardModal();
            }}
            onFocus={() => {}}
            onBlur={() => {}}
          >
            {fetchStrings("!system", 1296)}
          </Button>

          <Button
            disabled={!cancelable}
            onClick={() => {
              sendSelectCardResponse([CANCEL_RESPONSE]);
              resetCheckCardModal();
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
                <CheckCard
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
