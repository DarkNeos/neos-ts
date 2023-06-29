// 表示形式选择弹窗
import { CheckCard } from "@ant-design/pro-components";
import { Button } from "antd";
import React, { useState } from "react";
import { proxy, useSnapshot } from "valtio";

import { sendSelectPositionResponse, ygopro } from "@/api";

import { NeosModal } from "./NeosModal";

interface PositionModalProps {
  isOpen: boolean;
  positions: ygopro.CardPosition[];
}
const defaultProps = { isOpen: false, positions: [] };

const localStore = proxy<PositionModalProps>(defaultProps);

export const PositionModal = () => {
  const { isOpen, positions } = useSnapshot(localStore);
  const [selected, setSelected] = useState<ygopro.CardPosition | undefined>(
    undefined
  );

  return (
    <NeosModal
      title="请选择表示形式"
      open={isOpen}
      footer={
        <Button
          disabled={selected === undefined}
          onClick={() => {
            if (selected !== undefined) {
              sendSelectPositionResponse(selected);
              rs();
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
    </NeosModal>
  );
};

function cardPositionToChinese(position: ygopro.CardPosition): string {
  switch (position) {
    // TODO: i18n
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

let rs: (arg?: any) => void = () => {};

export const displayPositionModal = async (
  positions: ygopro.CardPosition[]
) => {
  localStore.positions = positions;
  localStore.isOpen = true;
  await new Promise<void>((resolve) => (rs = resolve));
  localStore.isOpen = false;
  localStore.positions = [];
};
