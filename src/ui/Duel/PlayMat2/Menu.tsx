import "@/styles/mat.css";

import Icon from "@ant-design/icons";
import { Button, Modal } from "antd";
import { ReactComponent as BattleSvg } from "neos-assets/crossed-swords.svg";
import { ReactComponent as EpSvg } from "neos-assets/power-button.svg";
import { ReactComponent as Main2Svg } from "neos-assets/sword-in-stone.svg";
import { ReactComponent as SurrenderSvg } from "neos-assets/truce.svg";
import React, { useState } from "react";
import { useSnapshot } from "valtio";

import {
  sendSelectBattleCmdResponse,
  sendSelectIdleCmdResponse,
  sendSurrender,
} from "@/api";
import {
  clearAllIdleInteractivities as clearAllIdleInteractivities,
  matStore,
} from "@/stores";

const IconSize = "150%";

const PhaseButton = (props: {
  text: string;
  enable: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) => {
  return (
    <Button
      icon={props.icon}
      disabled={!props.enable}
      onClick={props.onClick}
      size="large"
    >
      {props.text}
    </Button>
  );
};

const { phase } = matStore;

export const Menu = () => {
  const snapPhase = useSnapshot(phase);
  const enableBp = snapPhase.enableBp;
  const enableM2 = snapPhase.enableM2;
  const enableEp = snapPhase.enableEp;
  const currentPhase = snapPhase.currentPhase;

  const [modalOpen, setModalOpen] = useState(false);

  const response =
    currentPhase === "BATTLE_START" ||
    currentPhase === "BATTLE_STEP" ||
    currentPhase === "DAMAGE" ||
    currentPhase === "DAMAGE_GAL" ||
    currentPhase === "BATTLE"
      ? 3
      : 7;

  const onBp = () => {
    sendSelectIdleCmdResponse(6);
    clearAllIdleInteractivities(0); // 为什么要clear两次？
    clearAllIdleInteractivities(0);
    phase.enableBp = false;
  };
  const onM2 = () => {
    sendSelectBattleCmdResponse(2);
    clearAllIdleInteractivities(0);
    clearAllIdleInteractivities(0);
    phase.enableM2 = false;
  };
  const onEp = () => {
    sendSelectIdleCmdResponse(response);
    clearAllIdleInteractivities(0);
    clearAllIdleInteractivities(0);
    phase.enableEp = false;
  };
  const onSurrender = () => {
    setModalOpen(true);
  };

  return (
    <div id="controller">
      <PhaseButton
        icon={<Icon component={BattleSvg} style={{ fontSize: IconSize }} />}
        enable={enableBp}
        text="战斗阶段"
        onClick={onBp}
      />
      <PhaseButton
        icon={<Icon component={Main2Svg} style={{ fontSize: IconSize }} />}
        enable={enableM2}
        text="主要阶段2"
        onClick={onM2}
      />
      <PhaseButton
        icon={<Icon component={EpSvg} style={{ fontSize: IconSize }} />}
        enable={enableEp}
        text="结束回合"
        onClick={onEp}
      />
      <PhaseButton
        icon={<Icon component={SurrenderSvg} style={{ fontSize: IconSize }} />}
        enable={true}
        text="投降"
        onClick={onSurrender}
      />
      <Modal
        title="是否确认要投降？"
        open={modalOpen}
        closable={false}
        footer={
          <>
            <Button
              onClick={() => {
                sendSurrender();
                setModalOpen(false);
              }}
            >
              Yes
            </Button>
            <Button
              onClick={() => {
                setModalOpen(false);
              }}
            >
              No
            </Button>
          </>
        }
      />
    </div>
  );
};
