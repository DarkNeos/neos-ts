import { CheckCard } from "@ant-design/pro-components";
import { Button, Card, Col, Row } from "antd";
import React, { useState } from "react";
import { useSnapshot } from "valtio";

import { sendSelectCardResponse } from "@/api";
import { useConfig } from "@/config";
import { matStore, messageStore } from "@/stores";

import { DragModal } from "./DragModal";

const NeosConfig = useConfig();

const { checkCardModalV3 } = messageStore;

export const CheckCardModalV3 = () => {
  const snapCheckCardModalV3 = useSnapshot(checkCardModalV3);

  const isOpen = snapCheckCardModalV3.isOpen;
  const min = snapCheckCardModalV3.selectMin || 0;
  const max = snapCheckCardModalV3.selectMax || 0;
  const mustSelectOptions = snapCheckCardModalV3.mustSelectList;
  const selectAbleOptions = snapCheckCardModalV3.selectAbleList;
  const overflow = snapCheckCardModalV3.overflow;
  const LevelSum = snapCheckCardModalV3.allLevel;

  const [selectedOptions, setSelectedOptions] = useState([]);
  const Level1Sum = mustSelectOptions
    .concat(selectedOptions)
    .map((option) => option.level1)
    .reduce((sum, current) => sum + current, 0);
  const Level2Sum = mustSelectOptions
    .concat(selectedOptions)
    .map((option) => option.level2)
    .reduce((sum, current) => sum + current, 0);
  const hint = useSnapshot(matStore.hint);
  const preHintMsg = hint?.esHint || "";
  const selectHintMsg = hint?.esSelectHint || "请选择卡片";

  const responseable =
    (overflow
      ? Level1Sum >= LevelSum || Level2Sum >= LevelSum
      : Level1Sum == LevelSum || Level2Sum == LevelSum) &&
    selectedOptions.length <= max &&
    selectedOptions.length >= min;
  const onFinish = () => {
    sendSelectCardResponse(
      mustSelectOptions.concat(selectedOptions).map((option) => option.response)
    );
    checkCardModalV3.isOpen = false;
    checkCardModalV3.responseable = false;
    checkCardModalV3.overflow = false;
    checkCardModalV3.allLevel = 0;
    checkCardModalV3.mustSelectList = [];
    checkCardModalV3.selectAbleList = [];
  };

  return (
    <DragModal
      title={`${preHintMsg} ${selectHintMsg} ${min}-${max}`}
      open={isOpen}
      closable={false}
      footer={
        <>
          <Button disabled={!responseable} onClick={onFinish}>
            finish
          </Button>
        </>
      }
      width={800}
    >
      <CheckCard.Group
        bordered
        size="small"
        multiple={true}
        onChange={(values: any) => {
          console.log(values);
          setSelectedOptions(values);
        }}
      >
        <Row>
          {selectAbleOptions.map((option, idx) => {
            return (
              <Col span={4} key={idx}>
                <CheckCard
                  title={option.meta.text.name}
                  description={option.meta.text.desc}
                  style={{ width: 120 }}
                  cover={
                    <img
                      alt={option.meta.id.toString()}
                      src={`${NeosConfig.cardImgUrl}/${option.meta.id}.jpg`}
                      style={{ width: 100 }}
                    />
                  }
                  value={option}
                />
              </Col>
            );
          })}
        </Row>
      </CheckCard.Group>
      <p>必须选择的卡片</p>
      <Row>
        {mustSelectOptions.map((option, idx) => {
          return (
            <Col span={4} key={idx}>
              <Card
                hoverable
                style={{ width: 120 }}
                cover={
                  <img
                    alt={option.meta.id.toString()}
                    src={`${NeosConfig.cardImgUrl}/${option.meta.id}.jpg`}
                  />
                }
              />
            </Col>
          );
        })}
      </Row>
    </DragModal>
  );
};
