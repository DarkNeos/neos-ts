import React, { useRef, useState } from "react";
import { useAppSelector } from "../../hook";
import { store } from "../../store";
import {
  selectCheckCardModalCacnelResponse,
  selectCheckCardModalCancelAble,
  selectCheckCardModalIsOpen,
  selectCheckCardModalMinMax,
  selectCheckCardModalOnSubmit,
  selectCheckCardModalTags,
} from "../../reducers/duel/modal/mod";
import {
  resetCheckCardModal,
  setCheckCardModalIsOpen,
} from "../../reducers/duel/mod";
import { Modal, Button, Row, Col, Popover } from "antd";
import { CheckCard } from "@ant-design/pro-components";
import {
  sendSelectCardResponse,
  sendSelectChainResponse,
} from "../../api/ocgcore/ocgHelper";
import type { DraggableData, DraggableEvent } from "react-draggable";
import Draggable from "react-draggable";
import NeosConfig from "../../../neos.config.json";

const CheckCardModal = () => {
  const dispatch = store.dispatch;
  const isOpen = useAppSelector(selectCheckCardModalIsOpen);
  const { min, max } = useAppSelector(selectCheckCardModalMinMax);
  const tabs = useAppSelector(selectCheckCardModalTags);
  const onSubmit = useAppSelector(selectCheckCardModalOnSubmit);
  const cancelAble = useAppSelector(selectCheckCardModalCancelAble);
  const cancelResponse = useAppSelector(selectCheckCardModalCacnelResponse);
  const [response, setResponse] = useState<number[]>([]);
  const defaultValue: number[] = [];

  // Draggable 相关
  const [draggable, setDraggable] = useState(false);
  const [bounds, setBounds] = useState({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  });
  const draggleRef = useRef<HTMLDivElement>(null);

  const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };
  const onMouseOver = () => {
    if (draggable) {
      setDraggable(false);
    }
  };
  const onMouseOut = () => {
    setDraggable(true);
  };

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

  return (
    <Modal
      title={`请选择${min}到${max}张卡片`}
      open={isOpen}
      closable={false}
      footer={
        <>
          <Button
            disabled={response.length < min || response.length > max}
            onClick={() => {
              sendResponseHandler(onSubmit, response);
              dispatch(setCheckCardModalIsOpen(false));
              dispatch(resetCheckCardModal());
            }}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
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
                dispatch(setCheckCardModalIsOpen(false));
                dispatch(resetCheckCardModal());
              }}
              onMouseOver={onMouseOver}
              onMouseOut={onMouseOut}
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
      modalRender={(modal) => (
        <Draggable disabled={!draggable} bounds={bounds} onStart={onStart}>
          <div ref={draggleRef}>{modal}</div>
        </Draggable>
      )}
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
                    <Popover
                      content={
                        <div>
                          <p>{option.name}</p>
                          <p>{option.effectDesc}</p>
                        </div>
                      }
                    >
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
                        onMouseEnter={onMouseOver}
                        onMouseLeave={onMouseOut}
                        value={option.response}
                      />
                    </Popover>
                  </Col>
                );
              })}
            </Row>
          );
        })}
      </CheckCard.Group>
    </Modal>
  );
};

export default CheckCardModal;
