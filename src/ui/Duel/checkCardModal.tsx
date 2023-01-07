import React, { useState } from "react";
import { useAppSelector } from "../../hook";
import { store } from "../../store";
import {
  selectCheckCardModalIsOpen,
  selectCheckCardModalMinMax,
  selectCheckCardModalTags,
} from "../../reducers/duel/modalSlice";
import {
  resetCheckCardModal,
  setCheckCardModalIsOpen,
} from "../../reducers/duel/mod";
import { Modal, Button, Row, Col, Popover } from "antd";
import { CheckCard } from "@ant-design/pro-components";
import { sendSelectCardResponse } from "../../api/ocgcore/ocgHelper";

const CheckCardModal = () => {
  const dispatch = store.dispatch;
  const isOpen = useAppSelector(selectCheckCardModalIsOpen);
  const { min, max } = useAppSelector(selectCheckCardModalMinMax);
  const tabs = useAppSelector(selectCheckCardModalTags);
  const [response, setResponse] = useState<number[]>([]);
  const defaultValue: number[] = [];

  return (
    <Modal
      title={`请选择${min}到${max}张卡片`}
      open={isOpen}
      closable={false}
      footer={
        <Button
          disabled={response.length < min || response.length > max}
          onClick={() => {
            sendSelectCardResponse(response);
            dispatch(setCheckCardModalIsOpen(false));
            dispatch(resetCheckCardModal());
          }}
        >
          summit
        </Button>
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
                            src={`https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${option.code}.jpg`}
                            style={{ width: 100 }}
                          />
                        }
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
