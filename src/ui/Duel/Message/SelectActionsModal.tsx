import "@/styles/select-modal.scss";

import { MinusOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { CheckCard, CheckCardProps } from "@ant-design/pro-components";
import { Button, Card, Col, Popover, Row, Tabs } from "antd";
import React, { useState } from "react";
import { useSnapshot } from "valtio";

import {
  fetchStrings,
  sendSelectMultiResponse,
  sendSelectSingleResponse,
  ygopro,
} from "@/api";
import { useConfig } from "@/config";
import { clearSelectActions, matStore, messageStore } from "@/stores";

import { groupBy } from "../utils";
import { DragModal } from "./DragModal";

const NeosConfig = useConfig();
const CANCEL_RESPONSE = -1;
const FINISH_RESPONSE = -1;

const { selectCardActions, cardModal } = messageStore;

export const SelectActionsModal = () => {
  const snap = useSnapshot(selectCardActions);
  const isOpen = snap.isOpen;
  const isValid = snap.isValid;
  const isChain = snap.isChain;
  const min = snap.min ?? 0;
  const max = snap.max ?? 0;
  const single = snap.single ?? false;
  const selecteds = snap.selecteds;
  const selectables = snap.selectables;
  const mustSelects = snap.mustSelects;

  const [response, setResponse] = useState([]);
  const hint = useSnapshot(matStore.hint);
  const preHintMsg = hint?.esHint || "";
  const selectHintMsg = hint?.esSelectHint || "请选择卡片";

  const cancelable = snap.cancelAble;
  const finishable = snap.finishAble;
  const totalLevels = snap.totalLevels ?? 0;
  const overflow = snap.overflow || false;
  const LevelSum1 = mustSelects
    .concat(response)
    .map((option) => option.level1 || 0)
    .reduce((sum, current) => sum + current, 0);
  const LevelSum2 = mustSelects
    .concat(response)
    .map((option) => option.level2 || 0)
    .reduce((sum, current) => sum + current, 0);
  const levelMatched = overflow
    ? LevelSum1 >= totalLevels || LevelSum2 >= totalLevels
    : LevelSum1 == totalLevels || LevelSum2 == totalLevels;
  const submitable = single
    ? response.length == 1
    : response.length >= min && response.length <= max && levelMatched;

  const grouped = groupBy(selectables, (option) => option.location?.location!);

  return (
    <>
      <DragModal
        title={`${preHintMsg} ${selectHintMsg} ${min}-${max} ${
          single ? "每次选择一张" : ""
        }`}
        open={isOpen && isValid}
        onCancel={() => {
          selectCardActions.isOpen = false;
        }}
        closeIcon={<MinusOutlined />}
        footer={
          <>
            <Button
              disabled={!submitable}
              onClick={() => {
                const values = mustSelects
                  .concat(response)
                  .map((option) => option.response);

                if (isChain) {
                  sendSelectSingleResponse(values[0]);
                } else {
                  sendSelectMultiResponse(values);
                }
                clearSelectActions();
              }}
              onFocus={() => {}}
              onBlur={() => {}}
            >
              {fetchStrings("!system", 1211)}
            </Button>
            <Button
              disabled={!finishable}
              onClick={() => {
                sendSelectSingleResponse(FINISH_RESPONSE);
                clearSelectActions();
              }}
              onFocus={() => {}}
              onBlur={() => {}}
            >
              {fetchStrings("!system", 1296)}
            </Button>

            <Button
              disabled={!cancelable}
              onClick={() => {
                sendSelectSingleResponse(CANCEL_RESPONSE);
                clearSelectActions();
              }}
              onFocus={() => {}}
              onBlur={() => {}}
            >
              {fetchStrings("!system", 1295)}
            </Button>
          </>
        }
        width={800}
      >
        <CheckCard.Group
          multiple
          bordered
          size="small"
          onChange={(values: any) => {
            if (values.length > 0) {
              const meta = values[values.length - 1].meta;
              cardModal.meta = meta;
              cardModal.counters = {};
              cardModal.interactivies = [];
              cardModal.isOpen = true;
            }
            setResponse(values);
          }}
        >
          <Tabs
            type="card"
            items={grouped.map((group, idx) => {
              return {
                label: fetchStrings("!system", group[0] + 1000),
                key: idx.toString(),
                children: (
                  <Row>
                    {group[1].map((option, idx) => {
                      return (
                        <Col span={4} key={idx}>
                          <HoverCheckCard
                            hoverContent={option.effectDesc}
                            style={{
                              width: 120,
                              backgroundColor:
                                option.location?.controler === 0
                                  ? "white"
                                  : "grey",
                            }}
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
                            value={option}
                          />
                        </Col>
                      );
                    })}
                  </Row>
                ),
              };
            })}
          />
          <p>{selecteds.length > 0 ? fetchStrings("!system", 212) : ""}</p>
          <Row>
            {selecteds.concat(mustSelects).map((option, idx) => {
              return (
                <Col span={4} key={idx}>
                  <Card
                    style={{ width: 120 }}
                    cover={
                      <img
                        alt={option.meta.id.toString()}
                        src={
                          option.meta.id
                            ? `${NeosConfig.cardImgUrl}/${option.meta.id}.jpg`
                            : `${NeosConfig.assetsPath}/card_back.jpg`
                        }
                      />
                    }
                  />
                </Col>
              );
            })}
          </Row>
        </CheckCard.Group>
      </DragModal>
      {isValid && !isOpen ? (
        <div className="select-modal">
          <button
            className="select-modal-button"
            onClick={() => {
              selectCardActions.isOpen = true;
            }}
          >
            SCROLL UP
          </button>
        </div>
      ) : (
        <></>
      )}
    </>
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