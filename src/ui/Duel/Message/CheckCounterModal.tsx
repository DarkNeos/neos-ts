// 指示器选择弹窗
import { Omit } from "@react-spring/web";
import { Button, Card, Col, InputNumber, Row } from "antd";
import React, { useEffect, useState } from "react";
import { proxy, useSnapshot } from "valtio";

import { fetchStrings, Region, sendSelectCounterResponse } from "@/api";
import { useConfig } from "@/config";

import { NeosModal } from "./NeosModal";

interface CheckCounterModalProps {
  isOpen: boolean;
  counterType?: number;
  min?: number;
  options: {
    code: number;
    max: number;
  }[];
}
const defaultProps = {
  isOpen: false,
  options: [],
};

const localStore = proxy<CheckCounterModalProps>(defaultProps);

const NeosConfig = useConfig();
export const CheckCounterModal = () => {
  const snapCheckCounterModal = useSnapshot(localStore);

  const isOpen = snapCheckCounterModal.isOpen;
  const min = snapCheckCounterModal.min || 0;
  const options = snapCheckCounterModal.options;
  const counterName = fetchStrings(
    Region.Counter,
    `0x${snapCheckCounterModal.counterType!}`,
  ); // FIXME: 这里转十六进制的逻辑有问题

  const [selected, setSelected] = useState(new Array(options.length));
  const sum = selected.reduce((sum, current) => sum + current, 0);
  const finishable = sum === min;

  useEffect(() => {
    setSelected(new Array(options.length));
  }, [options]);

  const onFinish = () => {
    sendSelectCounterResponse(selected);
    rs();
  };

  return (
    <NeosModal
      title={`请移除${min}个${counterName}`}
      open={isOpen}
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
                    setSelected((prevSelected) => {
                      let newSelected = [...prevSelected];
                      newSelected[idx] = value ?? 0;
                      return newSelected;
                    });
                  }}
                />
              </Card>
            </Col>
          );
        })}
      </Row>
    </NeosModal>
  );
};

let rs: (arg?: any) => void = () => {};

export const displayCheckCounterModal = async (
  args: Omit<CheckCounterModalProps, "isOpen">,
) => {
  Object.entries(args).forEach(([key, value]) => {
    // @ts-ignore
    localStore[key] = value;
  });
  localStore.isOpen = true;
  await new Promise<void>((resolve) => (rs = resolve)); // 等待在组件内resolve
  localStore.isOpen = false;
  localStore.options = [];
  localStore.min = undefined;
  localStore.counterType = undefined;
};
