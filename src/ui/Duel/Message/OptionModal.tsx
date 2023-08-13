import { CheckCard } from "@ant-design/pro-components";
import { Button } from "antd";
import React, { useState } from "react";
import { proxy, useSnapshot } from "valtio";

import {
  type CardMeta,
  fetchStrings,
  getCardStr,
  Region,
  sendSelectIdleCmdResponse,
  sendSelectOptionResponse,
} from "@/api";

import { NeosModal } from "./NeosModal";

type Options = { msg: string; response: number }[];

const defaultStore = {
  title: "",
  isOpen: false,
  options: [] satisfies Options as Options,
};
const store = proxy(defaultStore);

export const OptionModal = () => {
  const snap = useSnapshot(store);

  const { title, isOpen, options } = snap;

  const [selected, setSelected] = useState<number | undefined>(undefined);

  const onClick = () => {
    if (selected !== undefined) {
      sendSelectOptionResponse(selected);
      rs();
    }
  };

  return (
    <NeosModal
      title={title}
      open={isOpen}
      footer={
        <Button disabled={selected === undefined} onClick={onClick}>
          确定
        </Button>
      }
    >
      <CheckCard.Group bordered size="small" onChange={setSelected as any}>
        {options.map((option, idx) => (
          <CheckCard key={idx} title={option.msg} value={option.response} />
        ))}
      </CheckCard.Group>
    </NeosModal>
  );
};

let rs: (v?: any) => void = () => {};
export const displayOptionModal = async (title: string, options: Options) => {
  store.title = title;
  store.options = options;
  store.isOpen = true;
  await new Promise((resolve) => (rs = resolve));
  store.isOpen = false;
};

export const handleEffectActivation = async (
  meta: CardMeta,
  effectInteractivies: {
    desc: string;
    response: number;
    effectCode: number | undefined;
  }[]
) => {
  if (!effectInteractivies.length) {
    return;
  }
  if (effectInteractivies.length === 1) {
    // 如果只有一个效果，点击直接触发
    sendSelectIdleCmdResponse(effectInteractivies[0].response);
  } else {
    // optionsModal
    const options = effectInteractivies.map((effect) => {
      const effectMsg =
        meta && effect.effectCode
          ? getCardStr(meta, effect.effectCode & 0xf) ?? "[:?]"
          : "[:?]";
      return {
        msg: effectMsg,
        response: effect.response,
      };
    });
    await displayOptionModal(fetchStrings(Region.System, 556), options); // 主动发动效果，所以不需要await，但是以后可能要留心
  }
};
