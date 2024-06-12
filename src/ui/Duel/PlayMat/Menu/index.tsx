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
import classNames from "classnames";
import { cloneElement, useEffect, useState } from "react";
import { useSnapshot } from "valtio";

import {
  sendSelectBattleCmdResponse,
  sendSelectIdleCmdResponse,
  sendSelectSingleResponse,
  sendSurrender,
  ygopro,
} from "@/api";
import { ChainSetting, matStore } from "@/stores";
import { IconFont } from "@/ui/Shared";

import styles from "./index.module.scss";
import PhaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType;
import { clearAllIdleInteractivities, clearSelectInfo } from "../../utils";
import { openChatBox } from "../ChatBox";
import { useTranslation } from "react-i18next";

const { useToken } = theme;

const FINISH_CANCEL_RESPONSE = -1;
const language = localStorage.getItem('language');

const drawPhase = language != 'cn' ? 'Draw' : '抽卡阶段';
const standbyPhase = language != 'cn' ? 'Standhy Phase' : '准备阶段';
const mainPhase1 = language != 'cn' ? 'Main Phase 1' : '主要阶段 1';
const battlePhase = language != 'cn' ? 'Battle Phase' : '战斗阶段';
const battleStart = language != 'cn' ? 'Battle Start' : '战斗开始';
const battleStep = language != 'cn' ? 'Battle Step' : '战斗步骤';
const damage = language != 'cn' ? 'Damage Step' : '伤害步骤';
const damageCalc = language != 'cn' ? 'Damage Step (Damage Calculation)' : '伤害步骤（伤害计算）';
const mainPhase2 = language != 'cn' ? 'Main Phase 2' : '主要阶段 2';
const endPhase = language != 'cn' ? 'End Phase' : '结束阶段';
const unknown = language != 'cn' ? 'Unknown' : '未知阶段';

// PhaseType, 中文, response, 是否显示，是否禁用
const initialPhaseBind: [
  phase: PhaseType,
  label: string,
  response: number,
  show: boolean,
  disabled: boolean,
][] = [
  [PhaseType.DRAW, drawPhase, -1, true, true],
  [PhaseType.STANDBY, standbyPhase, -1, true, true],
  [PhaseType.MAIN1, mainPhase1, -1, true, true],
  [PhaseType.BATTLE, battlePhase, 6, true, false],
  [PhaseType.BATTLE_START, battleStart, 3, false, true],
  [PhaseType.BATTLE_STEP, battleStep, 3, false, true],
  [PhaseType.DAMAGE, damage, 3, false, true],
  [PhaseType.DAMAGE_GAL, damageCalc, 3, false, true],
  [PhaseType.MAIN2, mainPhase2, 2, true, false],
  [PhaseType.END, endPhase, 7, true, false],
  [PhaseType.UNKNOWN, unknown, -1, false, true],
];

export const Menu = () => {
  const { t: i18n } = useTranslation("Menu");
  const {
    currentPlayer,
    chainSetting,
    phase: { enableBp, enableM2, enableEp, currentPhase },
  } = useSnapshot(matStore);
  const [phaseBind, setPhaseBind] = useState(initialPhaseBind);
  const [phaseSwitchItems, setPhaseSwitchItems] = useState<MenuProps["items"]>(
    [],
  );

  useEffect(() => {
    const endResponse = [
      PhaseType.BATTLE_START,
      PhaseType.BATTLE_STEP,
      PhaseType.DAMAGE,
      PhaseType.DAMAGE_GAL,
      PhaseType.BATTLE,
    ].includes(currentPhase)
      ? 3
      : 7;

    setPhaseBind((prev) => {
      const newItems = [...prev];

      // FIXME: 由于不断有玩家反馈说进不了战阶和主2，修改几次实现都解决不了问题，
      // 因此这里不进行限制。当存在无法进入战阶的自肃时，由后端（srvpro）判断
      for (const item of newItems) {
        const [phase, , , ,] = item;
        if (phase === PhaseType.BATTLE) {
          // item[4] = !enableBp;
        } else if (phase === PhaseType.MAIN2) {
          // item[4] = !enableM2;
        } else if (phase === PhaseType.END) {
          // item[4] = !enableEp;
          item[2] = endResponse;
        }
      }

      return newItems;
    });
  }, [enableBp, enableM2, enableEp, currentPhase]);

  useEffect(() => {
    const newPhaseSwitchItems = phaseBind
      .filter(([, , , show]) => show)
      .map(([phase, label, response, _, disabled], key) => ({
        key,
        label,
        disabled: disabled,
        onClick: () => {
          if (response === 2) sendSelectIdleCmdResponse(response);
          else sendSelectBattleCmdResponse(response);
          clearAllIdleInteractivities();
        },
        icon: disabled ? <CheckOutlined /> : <ArrowRightOutlined />,
        danger: phase === PhaseType.END,
      }));

    setPhaseSwitchItems(newPhaseSwitchItems);
  }, [phaseBind]);

  const allChain = language != 'cn' ? 'All Chain' : '';
  const ignoreChain = language != 'cn' ? 'Ignore Chain' : '';
  const smartChain = language != 'cn' ? 'Smart Chain' : '';

  const chainSettingTexts = [
    [ChainSetting.CHAIN_ALL, allChain],
    [ChainSetting.CHAIN_IGNORE, ignoreChain],
    [ChainSetting.CHAIN_SMART, smartChain],
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
      label: i18n("Cancel"),
    },
    {
      label: i18n("Confirm"),
      danger: true,
      onClick: sendSurrender,
    },
  ].map((item, i) => ({ key: i, ...item }));

  const globalDisable = !matStore.isMe(currentPlayer);

  return (
    <div className={styles["menu-container"]}>
      <SelectManager />
      <DropdownWithTitle
        title={i18n("SelectPhase")}
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
      <Tooltip title={i18n("ChatRoom")}>
        <Button
          icon={<MessageFilled />}
          onClick={openChatBox}
          type="text"
        ></Button>
      </Tooltip>
      <DropdownWithTitle
        title={ i18n("DoYouSurrunder") }
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

const SelectManager: React.FC = () => {
  const { t: i18n } = useTranslation("Menu");
  const { finishable, cancelable } = useSnapshot(matStore.selectUnselectInfo);
  const onFinishOrCancel = () => {
    sendSelectSingleResponse(FINISH_CANCEL_RESPONSE);
    clearSelectInfo();
  };
  return (
    <div className={styles["select-manager"]}>
      <Button
        className={classNames(styles.btn, { [styles.cancle]: cancelable })}
        disabled={!cancelable && !finishable}
        onClick={onFinishOrCancel}
      >
        {finishable ? i18n("SelectionComplete") : i18n("Deselect")}
      </Button>
    </div>
  );
};
