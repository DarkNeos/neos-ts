import {
  ArrowRightOutlined,
  CheckOutlined,
  CloseCircleFilled,
  MessageFilled,
  RobotFilled,
  RobotOutlined,
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
import { useTranslation } from "react-i18next";

import { getUIContainer } from "@/container/compat";

import { clearAllIdleInteractivities, clearSelectInfo } from "../../utils";
import { openChatBox } from "../ChatBox";

const { useToken } = theme;

const FINISH_CANCEL_RESPONSE = -1;

// Define the possible language codes (I18N)
type Language = "en" | "br" | "pt" | "fr" | "ja" | "ko" | "es" | "cn";

// Define the structure for the messages (I18N)
const messages: Record<
  Language,
  {
    drawPhase: string;
    standbyPhase: string;
    mainPhase1: string;
    battlePhase: string;
    battleStart: string;
    battleStep: string;
    damage: string;
    damageCalc: string;
    mainPhase2: string;
    endPhase: string;
    allChain?: string;
    ignoreChain?: string;
    smartChain?: string;
    unknown: string;
  }
> = {
  en: {
    drawPhase: "Draw",
    standbyPhase: "Standhy Phase",
    mainPhase1: "Main Phase 1",
    battlePhase: "Battle Phase",
    battleStart: "Battle Start",
    battleStep: "Battle Step",
    damage: "Damage Step",
    damageCalc: "Damage Step (Damage Calculation)",
    mainPhase2: "Main Phase 2",
    endPhase: "End Phase",
    allChain: "All Chain",
    ignoreChain: "Ignore Chain",
    smartChain: "Smart Chain",
    unknown: "Unknown",
  },
  br: {
    drawPhase: "Compra",
    standbyPhase: "Fase de Espera",
    mainPhase1: "Fase Principal 1",
    battlePhase: "Fase de Batalha",
    battleStart: "Início da Batalha",
    battleStep: "Fase da Batalha",
    damage: "Fase de Dano",
    damageCalc: "Fase de Dano (Cálculo de Dano)",
    mainPhase2: "Fase Principal 2",
    endPhase: "Fase Final",
    unknown: "Desconhecido",
  },
  pt: {
    drawPhase: "Compra",
    standbyPhase: "Fase de Espera",
    mainPhase1: "Fase Principal 1",
    battlePhase: "Fase de Batalha",
    battleStart: "Início da Batalha",
    battleStep: "Fase da Batalha",
    damage: "Fase de Dano",
    damageCalc: "Fase de Dano (Cálculo de Dano)",
    mainPhase2: "Fase Principal 2",
    endPhase: "Fase Final",
    unknown: "Desconhecido",
  },
  fr: {
    drawPhase: "Pioche",
    standbyPhase: "Phase de Standby",
    mainPhase1: "Phase Principale 1",
    battlePhase: "Phase de Bataille",
    battleStart: "Début de la Bataille",
    battleStep: "Étape de Bataille",
    damage: "Étape de Dégâts",
    damageCalc: "Étape de Dégâts (Calcul des Dégâts)",
    mainPhase2: "Phase Principale 2",
    endPhase: "Phase Finale",
    unknown: "Inconnu",
  },
  ja: {
    drawPhase: "ドロー",
    standbyPhase: "スタンバイフェイズ",
    mainPhase1: "メインフェイズ 1",
    battlePhase: "バトルフェイズ",
    battleStart: "バトル開始",
    battleStep: "バトルステップ",
    damage: "ダメージステップ",
    damageCalc: "ダメージステップ（ダメージ計算）",
    mainPhase2: "メインフェイズ 2",
    endPhase: "エンドフェイズ",
    unknown: "未知",
  },
  ko: {
    drawPhase: "드로우",
    standbyPhase: "대기 페이즈",
    mainPhase1: "메인 페이즈 1",
    battlePhase: "배틀 페이즈",
    battleStart: "배틀 시작",
    battleStep: "배틀 스텝",
    damage: "데미지 스텝",
    damageCalc: "데미지 스텝 (데미지 계산)",
    mainPhase2: "메인 페이즈 2",
    endPhase: "엔드 페이즈",
    unknown: "알 수 없음",
  },
  es: {
    drawPhase: "Robo",
    standbyPhase: "Fase de Espera",
    mainPhase1: "Fase Principal 1",
    battlePhase: "Fase de Batalla",
    battleStart: "Inicio de Batalla",
    battleStep: "Paso de Batalla",
    damage: "Paso de Daño",
    damageCalc: "Paso de Daño (Cálculo de Daño)",
    mainPhase2: "Fase Principal 2",
    endPhase: "Fase Final",
    unknown: "Desconocido",
  },
  cn: {
    drawPhase: "抽卡阶段",
    standbyPhase: "准备阶段",
    mainPhase1: "主要阶段 1",
    battlePhase: "战斗阶段",
    battleStart: "战斗开始",
    battleStep: "战斗步骤",
    damage: "伤害步骤",
    damageCalc: "伤害步骤（伤害计算）",
    mainPhase2: "主要阶段 2",
    endPhase: "结束阶段",
    allChain: "全部连锁",
    ignoreChain: "忽略连锁",
    smartChain: "智能连锁",
    unknown: "未知阶段",
  },
};

// Get the language from localStorage or default to 'cn' (I18N)
const language = (localStorage.getItem("language") || "cn") as Language;
const drawPhase = messages[language].drawPhase;
const standbyPhase = messages[language].standbyPhase;
const mainPhase1 = messages[language].mainPhase1;
const battlePhase = messages[language].battlePhase;
const battleStart = messages[language].battleStart;
const battleStep = messages[language].battleStep;
const damage = messages[language].damage;
const damageCalc = messages[language].damageCalc;
const mainPhase2 = messages[language].mainPhase2;
const endPhase = messages[language].endPhase;
const allChain = messages[language].allChain ?? "All Chain";
const ignoreChain = messages[language].ignoreChain ?? "Ignore Chain";
const smartChain = messages[language].smartChain ?? "Smart Chain";
const unknown = messages[language].unknown;
/* End of definition (I18N) */

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
  const container = getUIContainer();
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

  const [enableKuriboh, setEnableKuriboh] = useState(
    container.getEnableKuriboh(),
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
          if (response === 2)
            sendSelectIdleCmdResponse(container.conn, response);
          else sendSelectBattleCmdResponse(container.conn, response);
          clearAllIdleInteractivities();
        },
        icon: disabled ? <CheckOutlined /> : <ArrowRightOutlined />,
        danger: phase === PhaseType.END,
      }));

    setPhaseSwitchItems(newPhaseSwitchItems);
  }, [phaseBind]);

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
      onClick: () => {
        sendSurrender(container.conn);
      },
    },
  ].map((item, i) => ({ key: i, ...item }));

  const globalDisable = !matStore.isMe(currentPlayer);

  const switchAutoSelect = () => {
    const newValue = !enableKuriboh;
    setEnableKuriboh(newValue);
    container.setEnableKuriboh(newValue);
  };

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
      <Tooltip title="AI">
        <Button
          icon={enableKuriboh ? <RobotFilled /> : <RobotOutlined />}
          onClick={switchAutoSelect}
          type="text"
        ></Button>
      </Tooltip>
      <Tooltip title={i18n("ChatRoom")}>
        <Button
          icon={<MessageFilled />}
          onClick={openChatBox}
          type="text"
        ></Button>
      </Tooltip>
      <DropdownWithTitle
        title={i18n("DoYouSurrunder")}
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
  const container = getUIContainer();
  const { t: i18n } = useTranslation("Menu");
  const { finishable, cancelable } = useSnapshot(matStore.selectUnselectInfo);
  const onFinishOrCancel = () => {
    sendSelectSingleResponse(container.conn, FINISH_CANCEL_RESPONSE);
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
