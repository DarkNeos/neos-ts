import "@/styles/card-modal.scss";

import classnames from "classnames";
import React from "react";
import { useSnapshot } from "valtio";

import { fetchStrings, getCardStr, sendSelectIdleCmdResponse } from "@/api";
import { useConfig } from "@/config";
import {
  clearAllIdleInteractivities as clearAllIdleInteractivities,
  messageStore,
} from "@/stores";

import {
  Attribute2StringCodeMap,
  extraCardTypes,
  Race2StringCodeMap,
  Type2StringCodeMap,
} from "../../../common";

const { cardModal } = messageStore;
const NeosConfig = useConfig();
const CARD_WIDTH = 200;

export const CardModal = () => {
  const snap = useSnapshot(cardModal);

  const isOpen = snap.isOpen;
  const meta = snap.meta;

  const name = meta?.text.name;
  const types = meta?.data.type;
  const race = meta?.data.race;
  const attribute = meta?.data.attribute;
  const desc = meta?.text.desc;
  const atk = meta?.data.atk;
  const def = meta?.data.def;
  const counters = snap.counters;

  const imgUrl = meta?.id
    ? `${NeosConfig.cardImgUrl}/${meta.id}.jpg`
    : undefined;
  const nonEffectInteractivies = snap.interactivies.filter(
    (item) => item.desc != "发动效果"
  );
  const effectInteractivies = snap.interactivies.filter(
    (item) => item.desc == "发动效果"
  );

  return (
    <div
      className={classnames("card-modal")}
      style={
        {
          "--visibility": isOpen ? "visible" : "hidden",
          "--opacity": isOpen ? 1 : 0,
        } as any
      }
    >
      <div className="card-modal-container">
        <img src={imgUrl} width={CARD_WIDTH} />
        <div className="card-modal-name">{name}</div>
        <AttLine
          types={extraCardTypes(types || 0)}
          race={race}
          attribute={attribute}
        />
        <AtkLine atk={atk} def={def} />
        <CounterLine counters={counters} />
        <div className="card-modal-effect">{desc}</div>
        {nonEffectInteractivies.map((interactive, idx) => {
          return (
            <button
              key={idx}
              className="card-modal-btn"
              onClick={() => {
                sendSelectIdleCmdResponse(interactive.response);
                cardModal.isOpen = false;
                clearAllIdleInteractivities(0);
                clearAllIdleInteractivities(1);
              }}
            >
              {interactive.desc}
            </button>
          );
        })}
        {effectInteractivies.length > 0 ? (
          effectInteractivies.length == 1 ? (
            // 如果只有一个效果，点击直接触发
            <button
              className="card-modal-btn"
              onClick={() => {
                sendSelectIdleCmdResponse(effectInteractivies[0].response);
                cardModal.isOpen = false;
                clearAllIdleInteractivities(0);
                clearAllIdleInteractivities(1);
              }}
            >
              {effectInteractivies[0].desc}
            </button>
          ) : (
            // 如果有多个效果，点击后进入`OptionModal`选择
            <button
              className="card-modal-btn"
              onClick={() => {
                for (const effect of effectInteractivies) {
                  const effectMsg =
                    meta && effect.effectCode
                      ? getCardStr(meta, effect.effectCode & 0xf) ?? "[:?]"
                      : "[:?]";
                  messageStore.optionModal.options.push({
                    msg: effectMsg,
                    response: effect.response,
                  });
                }
                cardModal.isOpen = false;
                clearAllIdleInteractivities(0);
                clearAllIdleInteractivities(1);
                messageStore.optionModal.isOpen = true;
              }}
            >
              发动效果
            </button>
          )
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

const AttLine = (props: {
  types: number[];
  race?: number;
  attribute?: number;
}) => {
  const race = props.race
    ? fetchStrings("!system", Race2StringCodeMap.get(props.race) || 0)
    : "?";
  const attribute = props.attribute
    ? fetchStrings("!system", Attribute2StringCodeMap.get(props.attribute) || 0)
    : "?";
  const types = props.types
    .map((t) => fetchStrings("!system", Type2StringCodeMap.get(t) || 0))
    .join("|");
  return (
    <div className="card-modal-attribute">{`【 ${race} / ${types} 】【 ${attribute} 】`}</div>
  );
};

const AtkLine = (props: { atk?: number; def?: number }) => (
  <div className="card-modal-atk">{`ATK/${
    props.atk !== undefined ? props.atk : "?"
  } DEF/${props.def !== undefined ? props.def : "?"}`}</div>
);

const CounterLine = (props: { counters: { [type: number]: number } }) => {
  const counters = [];
  for (const counterType in props.counters) {
    const count = props.counters[counterType];
    if (count > 0) {
      const counterStr = fetchStrings("!counter", `0x${counterType}`);
      counters.push(`${counterStr}: ${count}`);
    }
  }

  return (
    <>
      {counters.map((counter) => (
        <div className="card-modal-counter">{counter}</div>
      ))}
    </>
  );
};
