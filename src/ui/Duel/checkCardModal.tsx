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
import { Button, Row, Col, Popover } from "antd";
import { CheckCard } from "@ant-design/pro-components";
import {
  sendSelectCardResponse,
  sendSelectChainResponse,
} from "../../api/ocgcore/ocgHelper";
import NeosConfig from "../../../neos.config.json";
import DragModal from "./dragModal";

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
  const draggleRef = useRef<HTMLDivElement>(null);

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
    <DragModal
      modalProps={{
        title: `请选择${min}到${max}张卡片`,
        open: isOpen,
        closable: false,
        footer: (
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
        ),
        width: 800,
      }}
      dragRef={draggleRef}
      draggable={draggable}
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
    </DragModal>
  );
};

export default CheckCardModal;
