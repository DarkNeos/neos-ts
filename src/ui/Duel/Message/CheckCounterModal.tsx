import { Button, Card, Col, InputNumber, Row } from "antd";
import React, { useState } from "react";
import { useSnapshot } from "valtio";

import { fetchStrings, sendSelectCounterResponse } from "@/api";
import { useConfig } from "@/config";
import { messageStore } from "@/stores";

import { DragModal } from "./DragModal";

const { checkCounterModal } = messageStore;

const NeosConfig = useConfig();
export const CheckCounterModal = () => {
  const snapCheckCounterModal = useSnapshot(checkCounterModal);

  const isOpen = snapCheckCounterModal.isOpen;
  const min = snapCheckCounterModal.min || 0;
  const options = snapCheckCounterModal.options;
  const counterName = fetchStrings(
    "!counter",
    `0x${snapCheckCounterModal.counterType!}`
  ); // FIXME: 这里转十六进制的逻辑有问题

  const [selected, setSelected] = useState(new Array(options.length));
  const sum = selected.reduce((sum, current) => sum + current, 0);
  const finishable = sum === min;

  const onFinish = () => {
    sendSelectCounterResponse(selected);
    messageStore.checkCounterModal.isOpen = false;
    messageStore.checkCounterModal.min = undefined;
    messageStore.checkCounterModal.counterType = undefined;
    messageStore.checkCounterModal.options = [];
  };

  return (
    <DragModal
      title={`请移除${min}个${counterName}`}
      open={isOpen}
      closable={false}
      footer={
        <Button disabled={!finishable} onClick={onFinish}>
          finish
        </Button>
      }
    >
      <Row>
        {options.map((option, idx) => {
          return (
            <Col span={4} key={idx}>
              <Card
                hoverable
                style={{ width: 120 }}
                cover={
                  <img
                    alt={option.code.toString()}
                    src={`${NeosConfig.cardImgUrl}/${option.code}.jpg`}
                  />
                }
              >
                <InputNumber
                  min={0}
                  max={option.max}
                  defaultValue={0}
                  onChange={(value) => {
                    let newSelected = [...selected];
                    newSelected[idx] = value || 0;

                    setSelected(newSelected);
                  }}
                />
              </Card>
            </Col>
          );
        })}
      </Row>
    </DragModal>
  );
};
