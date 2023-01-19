import React from "react";
import { useAppSelector } from "../../hook";
import { store } from "../../store";
import { Modal, Button, Card, Col } from "antd";
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
    <Modal
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
            // @ts-ignore
            sendSelectUnselectCardResponse({ selected_ptr: value });
            dispatch(setCheckCardModalV2ResponseAble(false));
          }
        }}
      >
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
                    src={`https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${option.code}.jpg`}
                    style={{ width: 100 }}
                  />
                }
                value={option.response}
              />
            </Col>
          );
        })}
      </CheckCard.Group>
      <p>已经选择的卡片</p>
      {selectedOptions.map((option, idx) => {
        return (
          <Col span={4} key={idx}>
            <Card
              hoverable
              style={{ width: 120 }}
              cover={
                <img
                  alt={option.code.toString()}
                  src={`https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${option.code}.jpg`}
                />
              }
            />
          </Col>
        );
      })}
    </Modal>
  );
};

export default CheckCardModalV2;
