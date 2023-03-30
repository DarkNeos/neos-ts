import React, { useRef, useState } from "react";
import { useAppSelector } from "../../hook";
import { store } from "../../store";
import { Button, Card, Row, Col } from "antd";
import { CheckCard } from "@ant-design/pro-components";
import { sendSelectCardResponse } from "../../api/ocgcore/ocgHelper";
import {
  resetCheckCardModalV3,
  setCheckCardModalV3IsOpen,
  setCheckCardModalV3ResponseAble,
} from "../../reducers/duel/mod";
import NeosConfig from "../../../neos.config.json";
import { selectCheckCardModalV3 } from "../../reducers/duel/modal/checkCardModalV3Slice";
import DragModal from "./dragModal";

const CheckCardModalV3 = () => {
  const dispatch = store.dispatch;
  const state = useAppSelector(selectCheckCardModalV3);
  const isOpen = state.isOpen;
  const min = state.selectMin || 0;
  const max = state.selectMax || 0;
  const mustSelectOptions = state.mustSelectList;
  const selectAbleOptions = state.selectAbleList;
  const [selectedOptions, setSelectedOptions] = useState(state.selectedList);
  const overflow = state.overflow;
  const LevelSum = state.allLevel;
  const Level1Sum = mustSelectOptions
    .concat(selectedOptions)
    .map((option) => option.level1)
    .reduce((sum, current) => sum + current, 0);
  const Level2Sum = mustSelectOptions
    .concat(selectedOptions)
    .map((option) => option.level2)
    .reduce((sum, current) => sum + current, 0);
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
    dispatch(setCheckCardModalV3IsOpen(false));
    dispatch(resetCheckCardModalV3());
    dispatch(setCheckCardModalV3ResponseAble(false));
  };

  return (
    <DragModal
      modalProps={{
        title: `请选择卡片，最少${min}张，最多${max}张`,
        open: isOpen,
        closable: false,
        footer: (
          <>
            <Button
              disabled={!responseable}
              onClick={onFinish}
              onMouseOver={onMouseOver}
              onMouseOut={onMouseOut}
            >
              finish
            </Button>
          </>
        ),
        width: 800,
      }}
      dragRef={draggleRef}
      draggable={draggable}
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
                  onMouseEnter={onMouseOver}
                  onMouseLeave={onMouseOut}
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

export default CheckCardModalV3;
