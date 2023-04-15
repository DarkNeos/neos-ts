import React, { useState } from "react";
import { store } from "@/store";
import { useAppSelector } from "@/hook";
import {
  selectCurrentPhase,
  selectEnableBp,
  selectEnableEp,
  selectEnableM2,
} from "@/reducers/duel/phaseSlice";
import {
  sendSelectBattleCmdResponse,
  sendSelectIdleCmdResponse,
  sendSurrender,
} from "@/api/ocgcore/ocgHelper";
import {
  clearAllIdleInteractivities,
  setEnableBp,
  setEnableEp,
  setEnableM2,
} from "@/reducers/duel/mod";
import { Button, Modal, Space } from "antd";
import Icon from "@ant-design/icons";
import { ReactComponent as BattleSvg } from "../../../../neos-assets/crossed-swords.svg";
import { ReactComponent as Main2Svg } from "../../../../neos-assets/sword-in-stone.svg";
import { ReactComponent as EpSvg } from "../../../../neos-assets/power-button.svg";
import { ReactComponent as SurrenderSvg } from "../../../../neos-assets/truce.svg";

const IconSize = "150%";
const SpaceSize = 16;

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

export const Phase = () => {
  const dispatch = store.dispatch;
  const enableBp = useAppSelector(selectEnableBp);
  const enableM2 = useAppSelector(selectEnableM2);
  const enableEp = useAppSelector(selectEnableEp);
  const currentPhase = useAppSelector(selectCurrentPhase);
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
    dispatch(clearAllIdleInteractivities(0));
    dispatch(clearAllIdleInteractivities(0));

    sendSelectIdleCmdResponse(6);
    dispatch(setEnableBp(false));
  };
  const onM2 = () => {
    dispatch(clearAllIdleInteractivities(0));
    dispatch(clearAllIdleInteractivities(0));

    sendSelectBattleCmdResponse(2);
    dispatch(setEnableM2(false));
  };
  const onEp = () => {
    dispatch(clearAllIdleInteractivities(0));
    dispatch(clearAllIdleInteractivities(0));

    sendSelectIdleCmdResponse(response);
    dispatch(setEnableEp(false));
  };
  const onSurrender = () => {
    setModalOpen(true);
  };

  return (
    <Space wrap size={SpaceSize}>
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
    </Space>
  );
};
