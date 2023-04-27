import { CheckCard } from "@ant-design/pro-components";
import { Button } from "antd";
import React, { useState } from "react";
import { useSnapshot } from "valtio";

import { sendSelectOptionResponse } from "@/api";
import { messageStore } from "@/stores";

import { DragModal } from "./DragModal";

const { optionModal } = messageStore;

export const OptionModal = () => {
  const snapOptionModal = useSnapshot(optionModal);

  const isOpen = snapOptionModal.isOpen;
  const options = snapOptionModal.options;

  const [selected, setSelected] = useState<number | undefined>(undefined);

  return (
    <DragModal
      title="请选择需要发动的效果"
      open={isOpen}
      closable={false}
      footer={
        <Button
          disabled={selected === undefined}
          onClick={() => {
            if (selected !== undefined) {
              sendSelectOptionResponse(selected);
              optionModal.isOpen = false;
              optionModal.options = [];
            }
          }}
        >
          submit
        </Button>
      }
    >
      <CheckCard.Group
        bordered
        size="small"
        onChange={(value) => {
          // @ts-ignore
          setSelected(value);
        }}
      >
        {options.map((option, idx) => (
          <CheckCard key={idx} title={option.msg} value={option.response} />
        ))}
      </CheckCard.Group>
    </DragModal>
  );
};
