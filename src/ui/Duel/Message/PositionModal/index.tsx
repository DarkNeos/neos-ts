// 表示形式选择弹窗
import { CheckCard } from "@ant-design/pro-components";
import { Button } from "antd";
import React, { useState } from "react";
import { proxy, useSnapshot } from "valtio";

import { sendSelectPositionResponse, ygopro } from "@/api";

import { NeosModal } from "../NeosModal";

interface PositionModalProps {
  isOpen: boolean;
  positions: ygopro.CardPosition[];
}
const defaultProps = { isOpen: false, positions: [] };

const localStore = proxy<PositionModalProps>(defaultProps);

const language = localStorage.getItem('language');
const title = language != 'cn' ? 'Please select a position' : '请选择表示形式';

export const PositionModal = () => {
  const { isOpen, positions } = useSnapshot(localStore);
  const [selected, setSelected] = useState<ygopro.CardPosition | undefined>(
    undefined,
  );

  
  return (
    <NeosModal
      title={title}
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
            title={cardPosition(position)}
            value={position}
          />
        ))}
      </CheckCard.Group>
    </NeosModal>
  );
};

function cardPosition(position: ygopro.CardPosition): string {
  const faceUpAtk = language != 'cn' ? 'Face-Up Attack' : "正面攻击形式";
  const faceUpDef = language != 'cn' ? 'Face-Up Defense' : "正面防守形式";
  const faceDownAtk = language != 'cn' ? 'Face-Down Attack' : "背面攻击形式";
  const faceDownDef = language != 'cn' ? 'Face-Down Defense' : "背面防守形式";

  switch (position) {
    case ygopro.CardPosition.FACEUP_ATTACK: {
      return faceUpAtk;
    }
    case ygopro.CardPosition.FACEUP_DEFENSE: {
      return faceUpDef;
    }
    case ygopro.CardPosition.FACEDOWN_ATTACK: {
      return faceDownAtk;
    }
    case ygopro.CardPosition.FACEDOWN_DEFENSE: {
      return faceDownDef;
    }
    default: {
      return "[?]";
    }
  }
}

let rs: (arg?: any) => void = () => {};

export const displayPositionModal = async (
  positions: ygopro.CardPosition[],
) => {
  localStore.positions = positions;
  localStore.isOpen = true;
  await new Promise<void>((resolve) => (rs = resolve));
  localStore.isOpen = false;
  localStore.positions = [];
};
