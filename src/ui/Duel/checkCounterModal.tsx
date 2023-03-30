import { Button, Row, Col, Card, InputNumber } from "antd";
import React, { useRef, useState } from "react";
import { sendSelectCounterResponse } from "../../api/ocgcore/ocgHelper";
import { fetchStrings } from "../../api/strings";
import { useAppSelector } from "../../hook";
import { clearCheckCounter } from "../../reducers/duel/mod";
import { selectCheckCounterModal } from "../../reducers/duel/modal/checkCounterModalSlice";
import { store } from "../../store";
import DragModal from "./dragModal";
import NeosConfig from "../../../neos.config.json";

const CheckCounterModal = () => {
  const dispatch = store.dispatch;
  const state = useAppSelector(selectCheckCounterModal);
  const isOpen = state.isOpen;
  const counterName = fetchStrings("!counter", `0x${state.counterType!}`);
  const min = state.min || 0;
  const options = state.options;
  const [selected, setSelected] = useState(options.map((_) => 0));
  const finishable = selected.reduce((sum, current) => sum + current, 0) == min;
  const draggleRef = useRef<HTMLDivElement>(null);

  const onFinish = () => {
    sendSelectCounterResponse(selected);
    dispatch(clearCheckCounter);
  };

  return (
    <DragModal
      modalProps={{
        title: `请移除${min}个${counterName}`,
        open: isOpen,
        closable: false,
        footer: (
          <Button disabled={!finishable} onClick={onFinish}>
            finish
          </Button>
        ),
      }}
      dragRef={draggleRef}
      draggable={true}
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
                    setSelected((prev) => ({
                      ...prev,
                      [idx]: value || 0,
                    }));
                  }}
                />
              </Card>
            </Col>
          );
        })}
      </Row>
    </DragModal>
  );
};

export default CheckCounterModal;
