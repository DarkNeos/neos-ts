// 表示形式选择弹窗
import { Button } from "antd";
import React from "react";
import { proxy, useSnapshot } from "valtio";

import { sendSelectPositionResponse, ygopro } from "@/api";
import { getUIContainer } from "@/container/compat";

import { NeosModal } from "../NeosModal";
import styles from "./index.module.scss";

interface PositionModalProps {
  isOpen: boolean;
  positions: ygopro.CardPosition[];
}
const defaultProps = { isOpen: false, positions: [] };

const localStore = proxy<PositionModalProps>(defaultProps);

// Define a type for translations with an index signature (I18N)
interface Translations {
  [key: string]: {
    Title: string;
    FACEUP_ATTACK: string;
    FACEUP_DEFENSE: string;
    FACEDOWN_ATTACK: string;
    FACEDOWN_DEFENSE: string;
  };
}

// Retrieve language from localStorage or default to "cn"
const language = localStorage.getItem("language") || "cn";

// Define translations for different languages (I18N)
const translations: Translations = {
  en: {
    Title: "Please select a position",
    FACEUP_ATTACK: "Face-Up Attack",
    FACEUP_DEFENSE: "Face-Up Defense",
    FACEDOWN_ATTACK: "Face-Down Attack",
    FACEDOWN_DEFENSE: "Face-Down Defense",
  },
  br: {
    Title: "Por favor, selecione uma posição",
    FACEUP_ATTACK: "Ataque com a Face para Cima",
    FACEUP_DEFENSE: "Defesa com a Face para Cima",
    FACEDOWN_ATTACK: "Ataque com a Face para Baixo",
    FACEDOWN_DEFENSE: "Defesa com a Face para Baixo",
  },
  pt: {
    Title: "Por favor, selecione uma posição",
    FACEUP_ATTACK: "Ataque com a Face para Cima",
    FACEUP_DEFENSE: "Defesa com a Face para Cima",
    FACEDOWN_ATTACK: "Ataque com a Face para Baixo",
    FACEDOWN_DEFENSE: "Defesa com a Face para Baixo",
  },
  fr: {
    Title: "Veuillez sélectionner une position",
    FACEUP_ATTACK: "Attaque Face Visible",
    FACEUP_DEFENSE: "Défense Face Visible",
    FACEDOWN_ATTACK: "Attaque Face Cachée",
    FACEDOWN_DEFENSE: "Défense Face Cachée",
  },
  ja: {
    Title: "ポジションを選択してください",
    FACEUP_ATTACK: "表側攻撃表示",
    FACEUP_DEFENSE: "表側守備表示",
    FACEDOWN_ATTACK: "裏側攻撃表示",
    FACEDOWN_DEFENSE: "裏側守備表示",
  },
  ko: {
    Title: "포지션을 선택해주세요",
    FACEUP_ATTACK: "앞면 공격 표시",
    FACEUP_DEFENSE: "앞면 수비 표시",
    FACEDOWN_ATTACK: "뒷면 공격 표시",
    FACEDOWN_DEFENSE: "뒷면 수비 표시",
  },
  es: {
    Title: "Por favor, seleccione una posición",
    FACEUP_ATTACK: "Ataque en Posición de Ataque",
    FACEUP_DEFENSE: "Defensa en Posición de Ataque",
    FACEDOWN_ATTACK: "Ataque en Posición de Defensa",
    FACEDOWN_DEFENSE: "Defensa en Posición de Defensa",
  },
  cn: {
    Title: "请选择表示形式",
    FACEUP_ATTACK: "正面攻击形式",
    FACEUP_DEFENSE: "正面防守形式",
    FACEDOWN_ATTACK: "背面攻击形式",
    FACEDOWN_DEFENSE: "背面防守形式",
  },
};

export const PositionModal = () => {
  const container = getUIContainer();
  const { isOpen, positions } = useSnapshot(localStore);

  const onSummit = (position: ygopro.CardPosition) => {
    sendSelectPositionResponse(container.conn, position);
    rs();
  };

  return (
    <NeosModal
      title={translations[language].Title}
      open={isOpen}
      centered
      footer={<></>}
    >
      <div className={styles.container}>
        {positions.map((position, idx) => (
          <Button key={idx} onClick={() => onSummit(position)}>
            {cardPosition(position)}
          </Button>
        ))}
      </div>
    </NeosModal>
  );
};

// Function to get card position based on language
function cardPosition(position: ygopro.CardPosition): string {
  const messages = translations[language];

  switch (position) {
    case ygopro.CardPosition.FACEUP_ATTACK: {
      return messages.FACEUP_ATTACK;
    }
    case ygopro.CardPosition.FACEUP_DEFENSE: {
      return messages.FACEUP_DEFENSE;
    }
    case ygopro.CardPosition.FACEDOWN_ATTACK: {
      return messages.FACEDOWN_ATTACK;
    }
    case ygopro.CardPosition.FACEDOWN_DEFENSE: {
      return messages.FACEDOWN_DEFENSE;
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
