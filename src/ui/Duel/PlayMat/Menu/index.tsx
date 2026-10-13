import {
  CloseCircleFilled,
  FastForwardOutlined,
  FileSearchOutlined,
  MessageFilled,
  PauseCircleFilled,
  PlayCircleFilled,
  QuestionCircleOutlined,
  ReloadOutlined,
  StepBackwardFilled,
  StepForwardFilled,
  SwapOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Divider,
  Dropdown,
  type DropdownProps,
  type MenuProps,
  Select,
  Space,
  theme,
  Tooltip,
} from "antd";
import { cloneElement, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { sendSurrender, ygopro } from "@/api";
import { getUIContainer } from "@/container/compat";
import {
  ChainSetting,
  DEFAULT_REPLAY_ADVANCE_MASK,
  matStore,
  replayStore,
  roomStore,
  trainingStore,
} from "@/stores";
import { disconnectSession } from "@/ui/Match/util";
import { IconFont } from "@/ui/Shared";
import { openReplayDecks, ReplayDecks } from "@/ui/Shared/ReplayDecks";
import { TrainingExitButton } from "@/ui/Training/ExitButton";
import { startTraining } from "@/ui/Training/util";

import { displayActionHistory } from "../../Message";
import { openChatBox } from "../ChatBox";
import { allChain, availableChain, ignoreChain, smartChain } from "../labels";
import { PhaseControl } from "../PhaseControl";
import styles from "./index.module.scss";

const { useToken } = theme;

const REPLAY_ADVANCE_EVENT = "neos:replay-advance";

interface ReplayAdvanceEventDetail {
  advanceMask?: number;
}

export const FieldControls = () => {
  const { chainSetting } = useSnapshot(matStore);
  const chainSettingTexts = [
    [ChainSetting.CHAIN_ALL, allChain],
    [ChainSetting.CHAIN_IGNORE, ignoreChain],
    [ChainSetting.CHAIN_SMART, smartChain],
    [ChainSetting.CHAIN_AVAILABLE, availableChain],
  ] as const;
  const chainSettingTestIds = {
    [ChainSetting.CHAIN_ALL]: "all",
    [ChainSetting.CHAIN_IGNORE]: "ignore",
    [ChainSetting.CHAIN_SMART]: "smart",
    [ChainSetting.CHAIN_AVAILABLE]: "available",
  };
  const chainSettingItems: MenuProps["items"] = chainSettingTexts.map(
    ([key, text]) => ({
      label: text,
      icon: <ChainIcon chainSetting={key} />,
      key,
      "data-testid": `duel-chain-setting-${chainSettingTestIds[key]}`,
      "data-chain-setting": chainSettingTestIds[key],
      onClick: () => {
        matStore.chainSetting = key;
      },
    }),
  );
  return (
    <>
      <PhaseControl />
      <div className={styles["chain-control"]}>
        <DropdownWithTitle
          menu={{
            items: chainSettingItems,
          }}
        >
          <Button
            className={styles["chain-button"]}
            aria-label={
              chainSettingTexts.find(([key]) => key === chainSetting)?.[1]
            }
            title={chainSettingTexts.find(([key]) => key === chainSetting)?.[1]}
            data-testid="duel-chain-setting"
            data-chain-setting={chainSettingTestIds[chainSetting]}
            icon={<ChainIcon chainSetting={chainSetting} />}
            type="text"
          ></Button>
        </DropdownWithTitle>
      </div>
    </>
  );
};

export const Menu = () => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const top = toolbarRef.current?.getBoundingClientRect().top;
        if (top !== undefined)
          document.documentElement.style.setProperty(
            "--duel-toolbar-top",
            `${top}px`,
          );
      });
    };
    const observer = new ResizeObserver(update);
    if (toolbarRef.current) observer.observe(toolbarRef.current);
    const root = document.getElementById("root");
    if (root) observer.observe(root);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      document.documentElement.style.removeProperty("--duel-toolbar-top");
    };
  }, []);
  const container = getUIContainer();
  const { t: i18n } = useTranslation("Menu");
  const { t: trainingText } = useTranslation("BuildDeck");
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { selfType } = useSnapshot(matStore);
  const room = useSnapshot(roomStore);
  const { isReplay } = useSnapshot(replayStore);
  const { session: training } = useSnapshot(trainingStore);
  const watching =
    selfType === ygopro.StocGameMessage.MsgStart.PlayerType.Observer ||
    room.selfType === ygopro.StocTypeChange.SelfType.OBSERVER;
  const leave = () => {
    disconnectSession();
    navigate("/match");
  };
  const surrenderMenuItems: MenuProps["items"] = [
    {
      label: i18n("Cancel"),
    },
    {
      label: i18n("Confirm"),
      danger: true,
      "data-testid": "duel-surrender-confirm",
      onClick: () => {
        sendSurrender(container.conn);
      },
    },
  ].map((item, i) => ({ key: i, ...item }));

  return (
    <div
      ref={toolbarRef}
      data-testid="duel-toolbar"
      className={styles["menu-container"]}
    >
      <ReplayControl />
      {isReplay && <ReplayDecks />}
      {training && (
        <>
          <Button
            data-testid="training-restart"
            icon={<ReloadOutlined />}
            type="text"
            onClick={() => {
              const session = trainingStore.session;
              if (!session) return;
              // 重开使用保存的训练快照，连接入口负责结束旧局并重新自动准备。
              void startTraining(session).catch((error) => {
                message.error(
                  error instanceof Error
                    ? error.message
                    : trainingText("TrainingFailed"),
                );
              });
              navigate("/waitroom", { replace: true });
            }}
          >
            {trainingText("TrainingRestart")}
          </Button>
          <TrainingExitButton />
        </>
      )}
      <Tooltip title={i18n("History")}>
        <Button
          icon={<FileSearchOutlined />}
          onClick={displayActionHistory}
          type="text"
        />
      </Tooltip>
      <Tooltip title={i18n("ChatRoom")}>
        <Button
          icon={<MessageFilled />}
          onClick={openChatBox}
          type="text"
        ></Button>
      </Tooltip>
      {/* 训练使用上方专属退出入口，普通观战和对局保留原退出方式。 */}
      {training ? null : watching || isReplay ? (
        <Button
          data-testid="duel-leave"
          onClick={leave}
          icon={<CloseCircleFilled />}
          type="text"
        >
          {isReplay ? "退出回放" : "退出观战"}
        </Button>
      ) : (
        <DropdownWithTitle
          title={i18n("DoYouSurrunder")}
          menu={{ items: surrenderMenuItems }}
        >
          <Button
            aria-label={i18n("DoYouSurrunder")}
            data-testid="duel-surrender"
            icon={<CloseCircleFilled />}
            type="text"
          ></Button>
        </DropdownWithTitle>
      )}
    </div>
  );
};

const ReplayControl: React.FC = () => {
  const { isReplay, paused, waiting, currentIndex, seeking, ended, speed } =
    useSnapshot(replayStore);

  useEffect(() => {
    const advanceReplay = (event: Event) => {
      const { advanceMask } =
        (event as CustomEvent<ReplayAdvanceEventDetail>).detail ?? {};

      if (typeof advanceMask === "number") {
        replayStore.advance(advanceMask);
      } else {
        replayStore.advance();
      }
    };

    window.addEventListener(REPLAY_ADVANCE_EVENT, advanceReplay);

    return () => {
      window.removeEventListener(REPLAY_ADVANCE_EVENT, advanceReplay);
    };
  }, []);

  if (!isReplay) return <></>;

  const togglePaused = () => {
    if (replayStore.paused) replayStore.resume();
    else replayStore.pause();
  };

  return (
    <>
      <Button
        aria-label="重播"
        title="重播"
        data-testid="replay-restart"
        icon={<ReloadOutlined />}
        disabled={seeking}
        onClick={() => replayStore.restart()}
        type="text"
      />
      <Button
        aria-label="上一步"
        title="上一步"
        data-testid="replay-previous"
        icon={<StepBackwardFilled />}
        disabled={seeking || currentIndex <= (replayStore.keyframes[0] ?? 0)}
        onClick={() => replayStore.previous()}
        type="text"
      />
      <Tooltip title={paused ? "Resume replay" : "Pause replay"}>
        <Button
          aria-label={paused ? "Resume replay" : "Pause replay"}
          data-testid="replay-toggle"
          data-replay-index={currentIndex}
          data-replay-paused={paused}
          data-replay-waiting={waiting}
          data-replay-seeking={seeking}
          data-replay-ended={ended}
          disabled={seeking || ended}
          icon={paused ? <PlayCircleFilled /> : <PauseCircleFilled />}
          onClick={togglePaused}
          type="text"
        />
      </Tooltip>
      <Tooltip title="Advance replay">
        <Button
          aria-label="Advance replay"
          data-testid="replay-advance"
          data-replay-default-advance-mask={DEFAULT_REPLAY_ADVANCE_MASK}
          data-replay-index={currentIndex}
          data-replay-waiting={waiting}
          disabled={!paused || !waiting || seeking || ended}
          icon={<StepForwardFilled />}
          onClick={() => replayStore.advance()}
          type="text"
        />
      </Tooltip>
      <Button
        aria-label="下一回合"
        title="下一回合"
        data-testid="replay-next-turn"
        icon={<FastForwardOutlined />}
        disabled={seeking || ended}
        onClick={() => replayStore.nextTurn()}
        type="text"
      />
      <Button
        aria-label="切换视角"
        title="切换视角"
        data-testid="replay-swap"
        icon={<SwapOutlined />}
        disabled={seeking}
        onClick={() => replayStore.swapView()}
        type="text"
      />
      <Select
        aria-label="录像速度"
        data-testid="replay-speed"
        value={speed}
        onChange={(value) => replayStore.setSpeed(value)}
        options={[0.5, 1, 1.5, 2, 4].map((value) => ({
          value,
          label: `${value}×`,
        }))}
        style={{ width: 76 }}
      />
      {(seeking || ended) && (
        <span className={styles.replayStatus} role="status">
          {seeking ? "正在定位…" : "播放结束"}
        </span>
      )}
      <Button
        data-testid="replay-extract-decks"
        onClick={openReplayDecks}
        type="text"
      >
        提取卡组
      </Button>
    </>
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
    case ChainSetting.CHAIN_AVAILABLE:
      return <QuestionCircleOutlined style={{ fontSize: "inherit" }} />;
    case ChainSetting.CHAIN_SMART:
      return <IconFont type="icon-chain" />;
    case ChainSetting.CHAIN_IGNORE:
    default:
      return <IconFont type="icon-chain-broken" />;
  }
};
