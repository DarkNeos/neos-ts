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
  Space,
  theme,
  Tooltip,
} from "antd";
import { cloneElement } from "react";
import { useSnapshot } from "valtio";

import {
  sendSelectBattleCmdResponse,
  sendSelectIdleCmdResponse,
  sendSurrender,
  ygopro,
} from "@/api";
import { cardStore, ChainSetting, matStore } from "@/stores";
import { IconFont } from "@/ui/Shared";

import styles from "./index.module.scss";
import PhaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType;

const { phase } = matStore;
const { useToken } = theme;
export const Menu = () => {
  const snapPhase = useSnapshot(phase);
  const currentPhase = snapPhase.currentPhase;
  const enableBp = snapPhase.enableBp;
  const enableM2 = snapPhase.enableM2;
  const enableEp = snapPhase.enableEp;
  const { currentPlayer, chainSetting } = useSnapshot(matStore);

  const clearAllIdleInteractivities = () => {
    for (const card of cardStore.inner) {
      card.idleInteractivities = [];
    }
  };

  const endResponse = [
    PhaseType.BATTLE_START,
    PhaseType.BATTLE_STEP,
    PhaseType.DAMAGE,
    PhaseType.DAMAGE_GAL,
    PhaseType.BATTLE,
  ].includes(currentPhase)
    ? 3
    : 7;

  // PhaseType, 中文, response, 是否显示
  const phaseBind: [
    phase: PhaseType,
    label: string,
    response: number,
    show: boolean,
  ][] = [
    [PhaseType.DRAW, "抽卡阶段", -1, true],
    [PhaseType.STANDBY, "准备阶段", -1, true],
    [PhaseType.MAIN1, "主要阶段 1", -1, true],
    [PhaseType.BATTLE, "战斗阶段", 6, true],
    [PhaseType.BATTLE_START, "战斗开始", 3, false],
    [PhaseType.BATTLE_STEP, "战斗步骤", 3, false],
    [PhaseType.DAMAGE, "伤害步骤", 3, false],
    [PhaseType.DAMAGE_GAL, "伤害步骤（伤害计算）", 3, false],
    [PhaseType.MAIN2, "主要阶段 2", 2, true],
    [PhaseType.END, "结束阶段", endResponse, true],
    [PhaseType.UNKNOWN, "未知阶段", -1, false],
  ];

  const checkPhaseEnabled = (phase: PhaseType) => {
    switch (phase) {
      case PhaseType.BATTLE:
        return enableBp;
      case PhaseType.MAIN2:
        return enableM2;
      case PhaseType.END:
        return enableEp;
      default:
        return true;
    }
  };

  const phaseSwitchItems: MenuProps["items"] = phaseBind
    .filter(([, , , show]) => show)
    .map(([phase, label, response], key) => ({
      key,
      label,
      disabled: currentPhase >= phase || !checkPhaseEnabled(phase),
      onClick: () => {
        if (response === 2) sendSelectIdleCmdResponse(response);
        else sendSelectBattleCmdResponse(response);
        clearAllIdleInteractivities();
      },
      icon:
        currentPhase >= phase || !checkPhaseEnabled(phase) ? (
          <CheckOutlined />
        ) : (
          <ArrowRightOutlined />
        ),
      danger: phase === PhaseType.END,
    }));

  const chainSettingTexts = [
    [ChainSetting.CHAIN_ALL, "全部连锁"],
    [ChainSetting.CHAIN_IGNORE, "忽略连锁"],
    [ChainSetting.CHAIN_SMART, "智能连锁"],
  ] as const;
  const chainSettingItems: MenuProps["items"] = chainSettingTexts.map(
    ([key, text]) => ({
      label: text,
      icon: <ChainIcon chainSetting={key} />,
      key,
      onClick: () => {
        matStore.chainSetting = key;
      },
    }),
  );

  const surrenderMenuItems: MenuProps["items"] = [
    {
      label: "取消",
    },
    {
      label: "确定",
      danger: true,
      onClick: sendSurrender,
    },
  ].map((item, i) => ({ key: i, ...item }));

  const globalDisable = !matStore.isMe(currentPlayer);
  return (
    <div className={styles["menu-container"]}>
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
      <DropdownWithTitle
        menu={{
          items: chainSettingItems,
        }}
      >
        <Button
          icon={<ChainIcon chainSetting={chainSetting} />}
          type="text"
        ></Button>
      </DropdownWithTitle>
      <Tooltip title="聊天室">
        <Button icon={<MessageFilled />} type="text"></Button>
      </Tooltip>
      <DropdownWithTitle
        title="是否投降？"
        menu={{ items: surrenderMenuItems }}
      >
        <Button icon={<CloseCircleFilled />} type="text"></Button>
      </DropdownWithTitle>
    </div>
  );
};

const DropdownWithTitle: React.FC<DropdownProps & { title?: string }> = (
  props,
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
          {props.title && (
            <>
              <Space style={{ padding: "12px 16px", fontSize: 12 }}>
                {props.title}
              </Space>
              <Divider style={{ margin: 0 }} />
            </>
          )}
          {cloneElement(menu as React.ReactElement, {
            style: menuStyle,
          })}
        </div>
      )}
      arrow
      trigger={["click"]}
    >
      {props.children}
    </Dropdown>
  );
};

const ChainIcon: React.FC<{ chainSetting: ChainSetting }> = ({
  chainSetting,
}) => {
  switch (chainSetting) {
    case ChainSetting.CHAIN_ALL:
      return <IconFont type="icon-chain-all" />;
    case ChainSetting.CHAIN_SMART:
      return <IconFont type="icon-chain" />;
    case ChainSetting.CHAIN_IGNORE:
    default:
      return <IconFont type="icon-chain-broken" />;
  }
};
