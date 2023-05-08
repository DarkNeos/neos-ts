import "@/styles/mat.css";

import { Button, Modal } from "antd";
import React, { useState } from "react";
import { useSnapshot } from "valtio";

import {
  fetchStrings,
  sendSelectBattleCmdResponse,
  sendSelectIdleCmdResponse,
  sendSurrender,
  ygopro,
} from "@/api";
import {
  clearAllIdleInteractivities as clearAllIdleInteractivities,
  matStore,
} from "@/stores";
import PhaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType;

const { phase } = matStore;

export const Menu = () => {
  const snapPhase = useSnapshot(phase);
  const enableBp = snapPhase.enableBp;
  const enableM2 = snapPhase.enableM2;
  const enableEp = snapPhase.enableEp;
  const currentPhase = snapPhase.currentPhase;

  const [modalOpen, setModalOpen] = useState(false);

  const response =
    currentPhase === PhaseType.BATTLE_START ||
    currentPhase === PhaseType.BATTLE_STEP ||
    currentPhase === PhaseType.DAMAGE ||
    currentPhase === PhaseType.DAMAGE_GAL ||
    currentPhase === PhaseType.BATTLE
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
        {fetchStrings("!system", 80)}
      </button>
      <button disabled={!enableM2} onClick={onM2}>
        {fetchStrings("!system", 80)?.concat("2")}
      </button>
      <button disabled={!enableEp} onClick={onEp}>
        {fetchStrings("!system", 81)}
      </button>
      <button onClick={onSurrender}>{fetchStrings("!system", 1351)}</button>
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
