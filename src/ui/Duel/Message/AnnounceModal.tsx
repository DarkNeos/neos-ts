import { CheckCard } from "@ant-design/pro-components";
import { Button } from "antd";
import React, { useState } from "react";
import { useSnapshot } from "valtio";

import { sendSelectOptionResponse } from "@/api";
import { messageStore } from "@/stores";

import { DragModal } from "./DragModal";

const { announceModal } = messageStore;

export const AnnounceModal = () => {
  const snap = useSnapshot(announceModal);

  const isOpen = snap.isOpen;
  const title = snap.title;
  const min = snap.min;
  const options = snap.options;
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
            announceModal.isOpen = false;
            announceModal.title = undefined;
            announceModal.options = [];
          }}
        >
          submit
        </Button>
      }
    >
      <CheckCard.Group
        bordered
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
