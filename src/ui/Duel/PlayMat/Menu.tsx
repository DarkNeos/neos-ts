import "@/styles/mat.css";

import { Button, Modal } from "antd";
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

const PhaseButton = (props: {
  text: string;
  enable: boolean;
  onClick: () => void;
}) => {
  return (
    <button disabled={!props.enable} onClick={props.onClick}>
      {props.text}
    </button>
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
    clearAllIdleInteractivities(0);
    clearAllIdleInteractivities(1);
    phase.enableBp = false;
  };
  const onM2 = () => {
    sendSelectBattleCmdResponse(2);
    clearAllIdleInteractivities(0);
    clearAllIdleInteractivities(1);
    phase.enableM2 = false;
  };
  const onEp = () => {
    sendSelectIdleCmdResponse(response);
    clearAllIdleInteractivities(0);
    clearAllIdleInteractivities(1);
    phase.enableEp = false;
  };
  const onSurrender = () => {
    setModalOpen(true);
  };

  return (
    <div id="controller">
      <button disabled={!enableBp} onClick={onBp}>
        战斗阶段
      </button>
      <button disabled={!enableM2} onClick={onM2}>
        主要阶段2
      </button>
      <button disabled={!enableEp} onClick={onEp}>
        结束回合
      </button>
      <button onClick={onSurrender}>投降</button>
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
