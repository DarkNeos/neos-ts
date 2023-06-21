import { CheckCard } from "@ant-design/pro-components";
import { Button } from "antd";
import React, { useState } from "react";
import { useSnapshot, proxy } from "valtio";

import { sendSelectOptionResponse } from "@/api";
import { NeosModal } from "./NeosModal";

type Options = { msg: string; response: number }[];

const defaultStore = {
  isOpen: false,
  options: [] satisfies Options as Options,
};
const store = proxy(defaultStore);

export const OptionModal = () => {
  const snap = useSnapshot(store);

  const { isOpen, options } = snap;

  const [selected, setSelected] = useState<number | undefined>(undefined);

  const onClick = () => {
    if (selected !== undefined) {
      sendSelectOptionResponse(selected);
      rs();
    }
  };

  return (
    <NeosModal
      title="请选择需要发动的效果"
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
export const displayOptionModal = async (options: Options) => {
  store.isOpen = true;
  store.options = options;
  await new Promise((resolve) => (rs = resolve));
  store.isOpen = false;
};
