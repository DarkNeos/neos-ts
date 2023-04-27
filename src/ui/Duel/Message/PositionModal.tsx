import { CheckCard } from "@ant-design/pro-components";
import { Button } from "antd";
import React, { useState } from "react";
import { useSnapshot } from "valtio";

import { sendSelectPositionResponse, ygopro } from "@/api";
import { messageStore } from "@/stores";

import { DragModal } from "./DragModal";

const { positionModal } = messageStore;

export const PositionModal = () => {
  const snapPositionModal = useSnapshot(positionModal);
  const isOpen = snapPositionModal.isOpen;
  const positions = snapPositionModal.positions;

  const [selected, setSelected] = useState<ygopro.CardPosition | undefined>(
    undefined
  );

  return (
    <DragModal
      title="请选择表示形式"
      open={isOpen}
      closable={false}
      footer={
        <Button
          disabled={selected === undefined}
          onClick={() => {
            if (selected !== undefined) {
              sendSelectPositionResponse(selected);
              positionModal.isOpen = false;
              positionModal.positions = [];
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
        {positions.map((position, idx) => (
          <CheckCard
            key={idx}
            title={cardPositionToChinese(position)}
            value={position}
          />
        ))}
      </CheckCard.Group>
    </DragModal>
  );
};

function cardPositionToChinese(position: ygopro.CardPosition): string {
  switch (position) {
    case ygopro.CardPosition.FACEUP_ATTACK: {
      return "正面攻击形式";
    }
    case ygopro.CardPosition.FACEUP_DEFENSE: {
      return "正面防守形式";
    }
    case ygopro.CardPosition.FACEDOWN_ATTACK: {
      return "背面攻击形式";
    }
    case ygopro.CardPosition.FACEDOWN_DEFENSE: {
      return "背面防守形式";
    }
    default: {
      return "[?]";
    }
  }
}
