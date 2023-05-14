import React from "react";
import "@/styles/card-modal.scss";
import { CardMeta, getCardStr, sendSelectIdleCmdResponse } from "@/api";
import {
  clearAllIdleInteractivities as clearAllIdleInteractivities,
  messageStore,
} from "@/stores";

const { cardModal } = messageStore;
export const EffectButton = (props: {
  meta?: CardMeta;
  effectInteractivies: {
    desc: string;
    response: number;
    effectCode?: number;
  }[];
}) => (
  <>
    {props.effectInteractivies.length > 0 ? (
      props.effectInteractivies.length == 1 ? (
        // 如果只有一个效果，点击直接触发
        <button
          className="card-modal-btn"
          onClick={() => {
            sendSelectIdleCmdResponse(props.effectInteractivies[0].response);
            cardModal.isOpen = false;
            clearAllIdleInteractivities(0);
            clearAllIdleInteractivities(1);
          }}
        >
          {props.effectInteractivies[0].desc}
        </button>
      ) : (
        // 如果有多个效果，点击后进入`OptionModal`选择
        <button
          className="card-modal-btn"
          onClick={() => {
            for (const effect of props.effectInteractivies) {
              const effectMsg =
                props.meta && effect.effectCode
                  ? getCardStr(props.meta, effect.effectCode & 0xf) ?? "[:?]"
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
  </>
);
