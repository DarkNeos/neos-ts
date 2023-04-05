import React, { useState } from "react";
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
import { CheckCard, CheckCardProps } from "@ant-design/pro-components";
import {
  sendSelectCardResponse,
  sendSelectChainResponse,
} from "../../api/ocgcore/ocgHelper";
import { ThunderboltOutlined } from "@ant-design/icons";
import NeosConfig from "../../../neos.config.json";
import DragModal from "./dragModal";
import { selectHint } from "../../reducers/duel/hintSlice";

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
  const hint = useAppSelector(selectHint);
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
              dispatch(setCheckCardModalIsOpen(false));
              dispatch(resetCheckCardModal());
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
                dispatch(setCheckCardModalIsOpen(false));
                dispatch(resetCheckCardModal());
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

export default CheckCardModal;
