import "./index.scss";

import {
  ArrowRightOutlined,
  CheckOutlined,
  CloseCircleFilled,
  MessageFilled,
  StepForwardFilled,
} from "@ant-design/icons";
import {
  Button,
  Divider,
  Dropdown,
  type DropdownProps,
  type MenuProps,
  Popconfirm,
  Space,
  theme,
  Tooltip,
} from "antd";
import { cloneElement, useState } from "react";
import { useSnapshot } from "valtio";

import {
  sendSelectBattleCmdResponse,
  sendSelectIdleCmdResponse,
  sendSurrender,
  ygopro,
} from "@/api";
import { cardStore, matStore } from "@/stores";
import PhaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType;

const { phase } = matStore;
const { useToken } = theme;
export const Menu = () => {
  const snapPhase = useSnapshot(phase);
  const { currentPlayer } = useSnapshot(matStore);
  const currentPhase = snapPhase.currentPhase;

  const response = [
    PhaseType.BATTLE_START,
    PhaseType.BATTLE_STEP,
    PhaseType.DAMAGE,
    PhaseType.DAMAGE_GAL,
    PhaseType.BATTLE,
  ].includes(currentPhase)
    ? 3
    : 7;

  const clearAllIdleInteractivities = () => {
    for (const card of cardStore.inner) {
      card.idleInteractivities = [];
    }
  };

  const phaseBind: [PhaseType, string, number][] = [
    [PhaseType.DRAW, "抽卡阶段", -1],
    [PhaseType.STANDBY, "准备阶段", -1],
    [PhaseType.MAIN1, "主要阶段 1", -1],
    [PhaseType.BATTLE, "战斗阶段", 6],
    // [PhaseType.BATTLE_START, "战斗开始", 3],
    // [PhaseType.BATTLE_STEP, "战斗步骤", 3],
    // [PhaseType.DAMAGE, "伤害步骤", 3],
    // [PhaseType.DAMAGE_GAL, "伤害步骤（伤害计算）", 3],
    [PhaseType.MAIN2, "主要阶段 2", 2],
    [PhaseType.END, "结束阶段", response],
    // [PhaseType.UNKNOWN, "未知阶段", response],
  ];

  const phaseSwitchItems: MenuProps["items"] = phaseBind.map(
    ([phase, str, response], i) => ({
      key: i,
      label: str,
      disabled: currentPhase >= phase,
      onClick: () => {
        if (response === 2) sendSelectIdleCmdResponse(response);
        else sendSelectBattleCmdResponse(response);
        clearAllIdleInteractivities();
      },
      icon: currentPhase >= phase ? <CheckOutlined /> : <ArrowRightOutlined />,
      danger: phase === PhaseType.END,
    })
  );

  const surrenderMenuItems: MenuProps["items"] = [
    {
      key: 0,
      label: "取消",
    },
    {
      key: 1,
      label: "确定",
      danger: true,
      onClick: sendSurrender,
    },
  ];

  const globalDisable = !matStore.isMe(currentPlayer);
  return (
    <>
      <div className="menu-container">
        <DropdownWithTitle
          title="请选择要进入的阶段"
          menu={{ items: phaseSwitchItems }}
          disabled={globalDisable}
        >
          <Button
            icon={<StepForwardFilled style={{ transform: "scale(1.5)" }} />}
            type="text"
            disabled={globalDisable}
          >
            {phaseBind.find(([key]) => key === currentPhase)?.[1]}
          </Button>
        </DropdownWithTitle>
        <Tooltip title="聊天室">
          <Button
            icon={<MessageFilled />}
            type="text"
            disabled={globalDisable}
          ></Button>
        </Tooltip>
        <DropdownWithTitle
          title="是否投降？"
          menu={{ items: surrenderMenuItems }}
          disabled={globalDisable}
        >
          <Button icon={<CloseCircleFilled />} type="text"></Button>
        </DropdownWithTitle>
      </div>
    </>
  );
};

const DropdownWithTitle: React.FC<DropdownProps & { title: string }> = (
  props
) => {
  const { token } = useToken();
  const contentStyle = {
    backgroundColor: token.colorBgElevated,
    borderRadius: token.borderRadiusLG,
    boxShadow: token.boxShadowSecondary,
  };
  const menuStyle = {
    boxShadow: "none",
  };
  return (
    <Dropdown
      {...props}
      dropdownRender={(menu) => (
        <div style={contentStyle}>
          <Space style={{ padding: "12px 16px" }}>{props.title}</Space>
          <Divider style={{ margin: 0 }} />
          {cloneElement(menu as React.ReactElement, {
            style: menuStyle,
          })}
        </div>
      )}
      arrow
      trigger={["click", "hover"]}
    >
      {props.children}
    </Dropdown>
  );
};
