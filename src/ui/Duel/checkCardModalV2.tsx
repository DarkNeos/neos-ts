import React from "react";
import { useAppSelector } from "../../hook";
import { store } from "../../store";
import { Button, Card, Row, Col } from "antd";
import { CheckCard } from "@ant-design/pro-components";
import {
  selectCheckCardModalV2CancelAble,
  selectCheckCardModalV2FinishAble,
  selectCheckCardModalV2IsOpen,
  selectCheckCardModalV2MinMax,
  selectCheckCardModalV2ResponseAble,
  selectCheckCardModalV2SelectAbleOptions,
  selectCheckCardModalV2SelectedOptions,
} from "../../reducers/duel/modal/checkCardModalV2Slice";
import { sendSelectUnselectCardResponse } from "../../api/ocgcore/ocgHelper";
import {
  resetCheckCardModalV2,
  setCheckCardModalV2IsOpen,
  setCheckCardModalV2ResponseAble,
} from "../../reducers/duel/mod";
import NeosConfig from "../../../neos.config.json";
import DragModal from "./dragModal";

const CheckCardModalV2 = () => {
  const dispatch = store.dispatch;
  const isOpen = useAppSelector(selectCheckCardModalV2IsOpen);
  const { min, max } = useAppSelector(selectCheckCardModalV2MinMax);
  const cancelable = useAppSelector(selectCheckCardModalV2CancelAble);
  const finishable = useAppSelector(selectCheckCardModalV2FinishAble);
  const selectableOptions = useAppSelector(
    selectCheckCardModalV2SelectAbleOptions
  );
  const selectedOptions = useAppSelector(selectCheckCardModalV2SelectedOptions);
  const responseable = useAppSelector(selectCheckCardModalV2ResponseAble);

  const onFinish = () => {
    sendSelectUnselectCardResponse({ cancel_or_finish: true });
    dispatch(setCheckCardModalV2IsOpen(false));
    dispatch(resetCheckCardModalV2());
    dispatch(setCheckCardModalV2ResponseAble(false));
  };
  const onCancel = () => {
    sendSelectUnselectCardResponse({ cancel_or_finish: true });
    dispatch(setCheckCardModalV2ResponseAble(false));
  };

  return (
    <DragModal
      title={`请选择未选择的卡片，最少${min}张，最多${max}张`}
      open={isOpen}
      closable={false}
      footer={
        <>
          <Button disabled={!finishable || !responseable} onClick={onFinish}>
            finish
          </Button>
          <Button disabled={!cancelable || !responseable} onClick={onCancel}>
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
            dispatch(setCheckCardModalV2IsOpen(false));
            // @ts-ignore
            sendSelectUnselectCardResponse({ selected_ptr: value });
            dispatch(setCheckCardModalV2ResponseAble(false));
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

export default CheckCardModalV2;
