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
import { Modal, Button, Row, Col } from "antd";
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
      footer={null}
    >
      <CheckCard.Group
        multiple
        bordered
        defaultValue={defaultValue}
        onChange={(value) => {
          // @ts-ignore
          setResponse(value);
        }}
      >
        {tabs.map((tab) => {
          return (
            <Row>
              {tab.options.map((option) => {
                return (
                  <Col span={5}>
                    <CheckCard
                      title={option.name}
                      description={option.desc}
                      cover={
                        <img
                          alt={option.code.toString()}
                          src={`https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${option.code}.jpg`}
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
      <Button
        title="完成"
        disabled={response.length < min || response.length > max}
        onClick={() => {
          sendSelectCardResponse(response);
          dispatch(setCheckCardModalIsOpen(false));
          dispatch(resetCheckCardModal());
        }}
      />
    </Modal>
  );
};

export default CheckCardModal;
