import { CheckCard } from "@ant-design/pro-components";
import { Button } from "antd";
import React, { useState } from "react";
import { proxy, useSnapshot } from "valtio";

import { sendSelectOptionResponse } from "@/api";

import { DragModal } from "./DragModal";

interface AnnounceModalProps {
  isOpen: boolean;
  title?: string;
  min: number;
  options: {
    info: string;
    response: number;
  }[];
}
const defaultProps = {
  isOpen: false,
  min: 1,
  options: [],
};

const localStore = proxy<AnnounceModalProps>(defaultProps);

export const AnnounceModal = () => {
  const { isOpen, title, min, options } = useSnapshot(localStore);

  const [selected, setSelected] = useState<number[]>([]);

  return (
    <DragModal
      title={title}
      open={isOpen}
      closable={false}
      footer={
        <Button
          disabled={selected.length != min}
          onClick={() => {
            let response = selected.reduce((res, current) => res | current, 0); // 多个选择求或
            sendSelectOptionResponse(response);
            rs();
          }}
        >
          submit
        </Button>
      }
    >
      <CheckCard.Group
        bordered
        multiple
        size="small"
        onChange={(value: any) => {
          setSelected(value);
        }}
      >
        {options.map((option, idx) => (
          <CheckCard key={idx} title={option.info} value={option.response} />
        ))}
      </CheckCard.Group>
    </DragModal>
  );
};

let rs: (arg?: any) => void = () => {};

export const displayAnnounceModal = async (
  args: Omit<AnnounceModalProps, "isOpen">
) => {
  Object.entries(args).forEach(([key, value]) => {
    // @ts-ignore
    localStore[key] = value;
  });
  localStore.isOpen = true;
  await new Promise<void>((resolve) => (rs = resolve)); // 等待在组件内resolve
  localStore.isOpen = false;
  localStore.min = 1;
  localStore.options = [];
  localStore.title = undefined;
};
