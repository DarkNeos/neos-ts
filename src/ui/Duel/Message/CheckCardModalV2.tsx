import { CheckCard } from "@ant-design/pro-components";
import { Button, Card, Col, Row } from "antd";
import React from "react";
import { useSnapshot } from "valtio";

import { sendSelectUnselectCardResponse } from "@/api";
import { useConfig } from "@/config";
import { matStore, messageStore } from "@/stores";

import { DragModal } from "./DragModal";

const { checkCardModalV2 } = messageStore;

const NeosConfig = useConfig();
export const CheckCardModalV2 = () => {
  const snapCheckCardModalV2 = useSnapshot(checkCardModalV2);

  const isOpen = snapCheckCardModalV2.isOpen;
  const min = snapCheckCardModalV2.selectMin ?? 0;
  const max = snapCheckCardModalV2.selectMax ?? 10;
  const cancelable = snapCheckCardModalV2.cancelAble;
  const finishable = snapCheckCardModalV2.finishAble;
  const selectableOptions = snapCheckCardModalV2.selectableOptions;
  const selectedOptions = snapCheckCardModalV2.selectedOptions;
  const responseable = snapCheckCardModalV2.responseable;
  const hint = useSnapshot(matStore.hint);

  const preHintMsg = hint?.esHint || "";
  const selectHintMsg = hint?.esSelectHint || "请选择卡片";

  const resetCheckCardModalV2 = () => {
    checkCardModalV2.isOpen = false;
    checkCardModalV2.finishAble = false;
    checkCardModalV2.cancelAble = false;
    checkCardModalV2.responseable = false;
    checkCardModalV2.selectableOptions = [];
    checkCardModalV2.selectedOptions = [];
  };
  const onFinishOrCancel = () => {
    sendSelectUnselectCardResponse({ cancel_or_finish: true });

    checkCardModalV2.isOpen = false;
    checkCardModalV2.responseable = false;
    resetCheckCardModalV2();
  };

  return (
    <DragModal
      title={`${preHintMsg} ${selectHintMsg} ${min}-${max}`}
      open={isOpen}
      closable={false}
      footer={
        <>
          <Button
            disabled={!finishable || !responseable}
            onClick={onFinishOrCancel}
          >
            finish
          </Button>
          <Button
            disabled={!cancelable || !responseable}
            onClick={onFinishOrCancel}
          >
            cancel
          </Button>
        </>
      }
      width={800}
    >
      <CheckCard.Group
        bordered
        size="small"
        onChange={(value) => {
          if (responseable) {
            // @ts-ignore
            sendSelectUnselectCardResponse({ selected_ptr: value });
            checkCardModalV2.isOpen = false;
            checkCardModalV2.responseable = false;
          }
        }}
      >
        <Row>
          {selectableOptions.map((option, idx) => {
            return (
              <Col span={4} key={idx}>
                <CheckCard
                  title={option.name}
                  description={option.desc}
                  style={{ width: 120 }}
                  cover={
                    <img
                      alt={option.code.toString()}
                      src={`${NeosConfig.cardImgUrl}/${option.code}.jpg`}
                      style={{ width: 100 }}
                    />
                  }
                  value={option.response}
                />
              </Col>
            );
          })}
        </Row>
      </CheckCard.Group>
      <p>已经选择的卡片</p>
      <Row>
        {selectedOptions.map((option, idx) => {
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
              />
            </Col>
          );
        })}
      </Row>
    </DragModal>
  );
};
