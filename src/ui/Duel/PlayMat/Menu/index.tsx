import "./index.scss";

import {
  Button,
  Tooltip,
  Dropdown,
  type MenuProps,
  theme,
  Divider,
  Space,
  Popconfirm,
} from "antd";
import React, { useState } from "react";
import { useSnapshot } from "valtio";
import {
  StepForwardFilled,
  MessageFilled,
  CloseCircleFilled,
  ArrowRightOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import {
  sendSelectBattleCmdResponse,
  sendSelectIdleCmdResponse,
  ygopro,
  sendSurrender,
} from "@/api";
import { cardStore, matStore } from "@/stores";
import PhaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType;

const { phase } = matStore;
const { useToken } = theme;
export const Menu = () => {
  const snapPhase = useSnapshot(phase);
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

  const items: MenuProps["items"] = phaseBind.map(
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

  const { token } = useToken();

  const contentStyle = {
    backgroundColor: token.colorBgElevated,
    borderRadius: token.borderRadiusLG,
    boxShadow: token.boxShadowSecondary,
  };

  const menuStyle = {
    boxShadow: "none",
  };

  const [showRendererTooltips, setShowRendererTooltips] = useState<
    boolean | undefined
  >(undefined);
  return (
    <>
      <div className="menu-container">
        <Dropdown
          menu={{ items }}
          dropdownRender={(menu) => (
            <div style={contentStyle}>
              {React.cloneElement(menu as React.ReactElement, {
                style: menuStyle,
              })}
              <Divider style={{ margin: 0 }} />
              <Space style={{ padding: 16 }}>请选择要进入的阶段</Space>
            </div>
          )}
          arrow
        >
          <Button
            icon={<StepForwardFilled style={{ transform: "scale(1.5)" }} />}
            type="text"
          >
            {phaseBind.find(([key]) => key === currentPhase)?.[1]}
          </Button>
        </Dropdown>
        <Tooltip title="聊天室">
          <Button icon={<MessageFilled />} type="text"></Button>
        </Tooltip>
        <Tooltip title="投降" color="red" open={showRendererTooltips}>
          <Popconfirm
            title="投降"
            description="您确认要投降？"
            onConfirm={sendSurrender}
            okText="确认"
            cancelText="取消"
            placement="topRight"
            arrow
            onOpenChange={(open) =>
              setShowRendererTooltips(!open ? undefined : !open)
            }
          >
            <Button icon={<CloseCircleFilled />} type="text"></Button>
          </Popconfirm>
        </Tooltip>
      </div>
    </>
  );
};
