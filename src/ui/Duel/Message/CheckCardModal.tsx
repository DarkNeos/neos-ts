import { ThunderboltOutlined } from "@ant-design/icons";
import { CheckCard, CheckCardProps } from "@ant-design/pro-components";
import { Button, Col, Popover, Row } from "antd";
import React, { useState } from "react";
import { useSnapshot } from "valtio";

import { sendSelectCardResponse, sendSelectChainResponse } from "@/api";
import { useConfig } from "@/config";
import { matStore, messageStore } from "@/stores";

import { DragModal } from "./DragModal";

const NeosConfig = useConfig();

const { checkCardModal } = messageStore;

export const CheckCardModal = () => {
  const snapCheckCardModal = useSnapshot(checkCardModal);
  const isOpen = snapCheckCardModal.isOpen;
  const min = snapCheckCardModal.selectMin ?? 0;
  const max = snapCheckCardModal.selectMax ?? 10;
  const tabs = snapCheckCardModal.tags;
  const onSubmit = snapCheckCardModal.onSubmit;
  const cancelAble = snapCheckCardModal.cancelAble;
  const cancelResponse = snapCheckCardModal.cancelResponse;

  const [response, setResponse] = useState<number[]>([]);
  const defaultValue: number[] = [];
  const hint = useSnapshot(matStore.hint);
  const preHintMsg = hint?.esHint || "";
  const selectHintMsg = hint?.esSelectHint || "请选择卡片";

  // TODO: 这里可以考虑更好地封装
  const sendResponseHandler = (
    handlerName: string | undefined,
    response: number[]
  ) => {
    switch (handlerName) {
      case "sendSelectChainResponse": {
        sendSelectChainResponse(response[0]);
        break;
      }
      case "sendSelectCardResponse": {
        sendSelectCardResponse(response);
        break;
      }
      default: {
      }
    }
  };

  const resetCheckCardModal = () => {
    checkCardModal.isOpen = false;
    checkCardModal.selectMin = undefined;
    checkCardModal.selectMax = undefined;
    checkCardModal.cancelAble = false;
    checkCardModal.cancelResponse = undefined;
    checkCardModal.tags = [];
  };

  return (
    <DragModal
      title={`${preHintMsg} ${selectHintMsg} ${min}-${max}`}
      open={isOpen}
      closable={false}
      footer={
        <>
          <Button
            disabled={response.length < min || response.length > max}
            onClick={() => {
              sendResponseHandler(onSubmit, response);
              checkCardModal.isOpen = false;
              resetCheckCardModal();
            }}
            onFocus={() => {}}
            onBlur={() => {}}
          >
            submit
          </Button>
          {cancelAble ? (
            <Button
              onClick={() => {
                if (cancelResponse) {
                  sendResponseHandler(onSubmit, [cancelResponse]);
                }
                checkCardModal.isOpen = false;
                resetCheckCardModal();
              }}
              onFocus={() => {}}
              onBlur={() => {}}
            >
              cancel
            </Button>
          ) : (
            <></>
          )}
        </>
      }
      width={800}
    >
      <CheckCard.Group
        multiple
        bordered
        size="small"
        defaultValue={defaultValue}
        onChange={(value) => {
          // @ts-ignore
          setResponse(value);
        }}
      >
        {tabs.map((tab, idx) => {
          return (
            <Row key={idx}>
              {tab.options.map((option, idx) => {
                return (
                  <Col span={4} key={idx}>
                    <HoverCheckCard
                      hoverContent={option.effectDesc}
                      title={option.meta.text.name}
                      description={option.meta.text.desc}
                      style={{ width: 120 }}
                      cover={
                        <img
                          alt={option.meta.id.toString()}
                          src={
                            option.meta.id
                              ? `${NeosConfig.cardImgUrl}/${option.meta.id}.jpg`
                              : `${NeosConfig.assetsPath}/card_back.jpg`
                          }
                          style={{ width: 100 }}
                        />
                      }
                      value={option.response}
                    />
                  </Col>
                );
              })}
            </Row>
          );
        })}
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
