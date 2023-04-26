import { CheckCard } from "@ant-design/pro-components";
import { Button, Card, Col, Row } from "antd";
import React, { useState } from "react";

import { sendSelectCardResponse } from "@/api/ocgcore/ocgHelper";
import { useConfig } from "@/config";
import { useAppSelector } from "@/hook";
import { selectHint } from "@/reducers/duel/hintSlice";
import {
  resetCheckCardModalV3,
  setCheckCardModalV3IsOpen,
  setCheckCardModalV3ResponseAble,
} from "@/reducers/duel/mod";
import { selectCheckCardModalV3 } from "@/reducers/duel/modal/checkCardModalV3Slice";
import { store } from "@/store";

import { DragModal } from "./DragModal";

import { messageStore, matStore } from "@/valtioStores";
import { useSnapshot } from "valtio";

const NeosConfig = useConfig();

const { checkCardModalV3 } = messageStore;

export const CheckCardModalV3 = () => {
  const snapCheckCardModalV3 = useSnapshot(checkCardModalV3);

  // const dispatch = store.dispatch;
  // const state = useAppSelector(selectCheckCardModalV3);

  // const isOpen = state.isOpen;
  // const min = state.selectMin || 0;
  // const max = state.selectMax || 0;
  // const mustSelectOptions = state.mustSelectList;
  // const selectAbleOptions = state.selectAbleList;
  // const overflow = state.overflow;
  // const LevelSum = state.allLevel;

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
  // const hint = useAppSelector(selectHint);
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
    // dispatch(setCheckCardModalV3IsOpen(false));
    // dispatch(resetCheckCardModalV3());
    // dispatch(setCheckCardModalV3ResponseAble(false));

    checkCardModalV3.isOpen = false;
    checkCardModalV3.responseable = false;
    checkCardModalV3.overflow = false;
    checkCardModalV3.allLevel = 0;
    checkCardModalV3.mustSelectList = [];
    checkCardModalV3.selectAbleList = [];

    // 下面就是resetCheckCardModalV3的内容
    // modalState.isOpen = false;
    // modalState.overflow = false;
    // modalState.allLevel = 0;
    // modalState.responseable = undefined;
    // modalState.mustSelectList = [];
    // modalState.selectAbleList = [];
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
