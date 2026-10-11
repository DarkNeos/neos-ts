import { CheckCircleFilled, LoadingOutlined } from "@ant-design/icons";
import HandType = ygopro.HandType;
import {
  sendHandResult,
  sendHsNotReady,
  sendHsReady,
  sendHsStart,
  sendHsToDuelList,
  sendHsToObserver,
  sendTpResult,
  sendUpdateDeck,
  ygopro,
} from "@/api";
import PlayerState = ygopro.StocHsPlayerChange.State;
import SelfType = ygopro.StocTypeChange.SelfType;
import { App, Avatar, Button, Skeleton, Space, Typography } from "antd";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoaderFunction, useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { useConfig } from "@/config";
import { getUIContainer } from "@/container/compat";
import { AudioActionType, changeScene } from "@/infra/audio";
import {
  accountStore,
  IDeck,
  Player,
  resetUniverse,
  RoomStage,
  roomStore,
  sideStore,
  trainingStore,
} from "@/stores";
import { deckLibraryStore } from "@/stores/deckLibraryStore";
import { disconnectSession } from "@/ui/Match/util";
import { Background, IconFont, SpecialButton } from "@/ui/Shared";
import { DeckLibraryPicker } from "@/ui/Shared/DeckLibraryPicker";

import { Chat } from "./Chat";
import styles from "./index.module.scss";
import { Mora, MoraPopover, Tp, TpPopover } from "./Popover";

const NeosConfig = useConfig();

export const loader: LoaderFunction = async () => {
  // 更新场景
  changeScene(AudioActionType.BGM_MENU);
  return null;
};

export const Component: React.FC = () => {
  const container = getUIContainer();
  const { t: i18n } = useTranslation("WaitRoom");
  const { t: trainingText } = useTranslation("BuildDeck");
  const { message } = App.useApp();
  const { user } = useSnapshot(accountStore);
  const [collapsed, setCollapsed] = useState(false);
  const { selectedDeck, selectingId } = useSnapshot(deckLibraryStore);
  const deck = selectedDeck as IDeck | undefined;
  const room = useSnapshot(roomStore);
  const { session: training } = useSnapshot(trainingStore);
  const { errorMsg } = room;
  const me = room.getMePlayer();
  const navigate = useNavigate();

  const updateDeck = (deck: IDeck) => {
    sendUpdateDeck(container.conn, deck);
    // 设置side里面的卡组
    sideStore.setSideDeck(deck);
  };

  const onDeckSelected = () => {
    sendHsNotReady(container.conn);
  };

  const onReady = () => {
    if (deckLibraryStore.selectingId) return;
    if (me?.state === PlayerState.NO_READY) {
      if (deck) {
        updateDeck(deck);
        sendHsReady(container.conn);
      } else {
        message.error("请先选择卡组");
      }
    } else {
      sendHsNotReady(container.conn);
    }
  };

  useEffect(() => {
    // 入场或切换卡组时同步服务端及换副卡组缓存。
    // 训练卡组已由身份消息上传，不能再用大厅中已保存的卡组覆盖它。
    if (
      !training &&
      deck &&
      room.selfType !== SelfType.OBSERVER &&
      room.stage === RoomStage.WAITING &&
      me?.state === PlayerState.NO_READY
    )
      updateDeck(deck);
  }, [deck, room.selfType, room.stage, me?.state, training]);
  useEffect(() => {
    if (room.stage === RoomStage.DUEL_START) {
      // 决斗开始，跳转决斗页面
      // 训练替换等待页记录，避免浏览器后退进入已经开始的房间。
      navigate("/duel", { replace: !!trainingStore.session });
      // TODO: 重置房间状态(也可能是在这个页面的loader之中重置，就看是进房间重置还是离开时重置，可能需要考虑意外离开的情况)
    }
  }, [room.stage]);
  useEffect(() => {
    // 出现错误
    if (errorMsg !== undefined && errorMsg !== "") {
      message.error(errorMsg);
      roomStore.errorMsg = undefined;
    }
  }, [errorMsg]);

  return (
    <div
      className={classNames(styles.container, {
        [styles.collapsed]: collapsed,
      })}
    >
      <Background />
      <div className={styles.sider}>
        <Chat />
      </div>
      <div className={styles.content}>
        <SideButtons
          collapsed={collapsed}
          switchCollapse={() => setCollapsed(!collapsed)}
        />
        <div className={styles.wrap}>
          {/* 训练自动准备和选择先后攻，这里只显示规则摘要与返回编辑器入口。 */}
          {training ? (
            <Space
              direction="vertical"
              align="center"
              data-testid="training-waitroom"
            >
              <Typography.Text>{training.deck.deckName}</Typography.Text>
              <Typography.Text type="secondary">
                {trainingText(
                  training.first ? "TrainingFirst" : "TrainingSecond",
                )}
                {` · ${trainingText("TrainingHandSizeSummary", {
                  count: training.handSize,
                })}`}
                {training.noShuffle &&
                  ` · ${trainingText("TrainingNoShuffle")}`}
              </Typography.Text>
            </Space>
          ) : (
            <Controller onDeckChange={onDeckSelected} />
          )}
          <div className={styles["both-side-container"]}>
            <PlayerZone
              who={Who.Me}
              player={me}
              avatar={user?.avatar_url}
              ready={me?.state === PlayerState.READY}
              btn={
                room.stage === RoomStage.WAITING ? (
                  training ? (
                    <LoadingOutlined className={styles["btn-join"]} />
                  ) : (
                    <Button
                      data-testid="waitroom-ready-toggle"
                      data-player-ready={me?.state === PlayerState.READY}
                      disabled={!!selectingId}
                      size="large"
                      className={styles["btn-join"]}
                      onClick={onReady}
                    >
                      {me?.state === PlayerState.NO_READY
                        ? i18n("DuelReady")
                        : i18n("CancelReady")}
                    </Button>
                  )
                ) : (
                  <MoraAvatar
                    mora={
                      me?.moraResult !== undefined &&
                      me.moraResult !== HandType.UNKNOWN
                        ? moraByHand[me.moraResult]
                        : undefined
                    }
                  />
                )
              }
            />
            {room.players
              .filter((player) => player !== undefined && !player.isMe)
              .map((player, idx) => (
                <PlayerZone
                  key={idx}
                  who={Who.Op}
                  player={player}
                  ready={player?.state === PlayerState.READY}
                  btn={
                    room.stage === RoomStage.WAITING ? null : (
                      <MoraAvatar
                        mora={
                          player?.moraResult !== undefined &&
                          player.moraResult !== HandType.UNKNOWN
                            ? moraByHand[player.moraResult]
                            : undefined
                        }
                      />
                    )
                  }
                />
              ))}
          </div>
          {training ? (
            <Space
              direction="vertical"
              align="center"
              className={styles["btns-action"]}
            >
              <Typography.Text data-testid="training-auto-start">
                <LoadingOutlined /> {trainingText("TrainingAutoStart")}
              </Typography.Text>
              <Button
                data-testid="training-return-editor"
                onClick={() => {
                  disconnectSession();
                  resetUniverse();
                  navigate("/build", { replace: true });
                }}
              >
                {trainingText("TrainingReturnToEditor")}
              </Button>
            </Space>
          ) : (
            <ActionButton
              onMoraSelect={(mora) => {
                sendHandResult(container.conn, mora);
                roomStore.stage = RoomStage.HAND_SELECTED;
              }}
              onTpSelect={(tp) => {
                sendTpResult(container.conn, tp === Tp.First);
                roomStore.stage = RoomStage.TP_SELECTED;
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const moraByHand: Partial<Record<HandType, Mora>> = {
  [HandType.ROCK]: Mora.Rock,
  [HandType.SCISSORS]: Mora.Scissors,
  [HandType.PAPER]: Mora.Paper,
};

enum Who {
  Me = "me",
  Op = "op",
}

// 玩家区域: 双方各有一个
const PlayerZone: React.FC<{
  btn?: React.ReactNode; // 在内部右侧可以放一个按钮
  who: Who;
  player?: Player;
  avatar?: string; // 因为对手的头像目前不清楚如何获取，因此暂时这里作为一个参数传入
  ready: boolean;
}> = ({ btn, who, player, avatar, ready }) => {
  return (
    <div
      data-testid={`waitroom-player-${who}`}
      data-player-name={
        player && player.state !== PlayerState.LEAVE ? player.name : ""
      }
      data-player-ready={ready}
      className={classNames(styles["side-box"], styles[who], {
        [styles.ready]: ready,
      })}
    >
      <div className={styles.inner}></div>
      <div style={{ position: "relative" }}>
        <Avatar
          src={
            avatar && player
              ? avatar
              : player && player.state !== PlayerState.LEAVE
              ? `${NeosConfig.assetsPath}/default-avatar.png`
              : ""
          }
          size={48}
        />
        {player?.state === PlayerState.READY && (
          <CheckCircleFilled className={styles.check} />
        )}
      </div>
      <div className={styles.name}>
        {player && player.state !== PlayerState.LEAVE ? (
          player.name
        ) : (
          <Skeleton.Input size="small" />
        )}
      </div>
      {btn}
    </div>
  );
};

// 展示猜拳结果的组件
const MoraAvatar: React.FC<{ mora?: Mora }> = ({ mora }) => (
  <div
    data-testid="waitroom-mora-result"
    data-hand={mora}
    style={{ marginLeft: "auto" }}
  >
    {mora ? (
      <Avatar
        style={{ marginLeft: "auto" }}
        size={48}
        icon={<IconFont type={`icon-hand-${mora}`} />}
      />
    ) : (
      <Skeleton.Avatar active size={48} />
    )}
  </div>
);

const Controller: React.FC<{ onDeckChange: () => void }> = ({
  onDeckChange,
}) => {
  const container = getUIContainer();
  const { t: i18n } = useTranslation("WaitRoom");
  const snapRoom = useSnapshot(roomStore);
  return (
    <Space>
      <DeckLibraryPicker
        testId="waitroom-deck-select"
        title={i18n("Deck")}
        style={{ width: "15.6rem" }}
        disabled={
          snapRoom.stage !== RoomStage.WAITING ||
          snapRoom.selfType === SelfType.OBSERVER
        }
        onSelected={onDeckChange}
      />
      <Button
        size="large"
        icon={<IconFont type="icon-record" size={18} />}
        onClick={() => {
          if (snapRoom.selfType !== SelfType.OBSERVER) {
            sendHsToObserver(container.conn);
          } else {
            sendHsToDuelList(container.conn);
          }
        }}
      >
        {snapRoom.selfType === SelfType.OBSERVER
          ? i18n("JoinDuelist")
          : i18n("JoinSpectator")}
        {!!snapRoom.observerCount && (
          <Avatar size="small" style={{ marginLeft: 8 }}>
            {snapRoom.observerCount}
          </Avatar>
        )}
      </Button>
    </Space>
  );
};

const SideButtons: React.FC<{
  switchCollapse: () => void;
  collapsed: boolean;
}> = ({ switchCollapse, collapsed }) => {
  const navigate = useNavigate();
  const { t: i18n } = useTranslation("WaitRoom");
  return (
    <div className={styles["btns-side"]}>
      <Button
        className={styles["btn"]}
        danger
        icon={
          <span className={styles["btn-icon"]}>
            <IconFont type="icon-exit" size={17} />
            <span className={styles["btn-text"]}>
              &nbsp;&nbsp;{i18n("LeaveRoom")}
            </span>
          </span>
        }
        onClick={() => {
          // 断开连接会清除训练状态，先保存返回目标再进行清理。
          const destination = trainingStore.session ? "/build" : "/match";
          // 断开websocket🔗
          disconnectSession();
          // 重置stores
          resetUniverse();
          // 返回上一个路由
          navigate(destination, { replace: destination === "/build" });
        }}
      />
      <Button
        className={styles["btn"]}
        icon={
          <span className={styles["btn-icon"]}>
            <IconFont type="icon-side-bar-fill" size={16} />
            <span className={styles["btn-text"]}>
              &nbsp;&nbsp;{collapsed ? i18n("Expand") : i18n("Collapse")}{" "}
              {i18n("Sidebar")}
            </span>
          </span>
        }
        onClick={switchCollapse}
      />
    </div>
  );
};

const ActionButton: React.FC<{
  onMoraSelect: (mora: Mora) => void;
  onTpSelect: (tp: Tp) => void;
}> = ({ onMoraSelect, onTpSelect }) => {
  const container = getUIContainer();
  const room = useSnapshot(roomStore);
  const { stage, isHost } = room;
  const { t: i18n } = useTranslation("WaitRoom");
  const startDisabled =
    stage !== RoomStage.WAITING ||
    (stage === RoomStage.WAITING &&
      (!isHost ||
        room.getMePlayer()?.state !== PlayerState.READY ||
        room.getOpPlayer()?.state !== PlayerState.READY));
  return (
    <MoraPopover onSelect={onMoraSelect}>
      <TpPopover onSelect={onTpSelect}>
        <SpecialButton
          data-testid="waitroom-start"
          data-room-stage={stage}
          data-room-is-host={isHost}
          aria-disabled={startDisabled}
          className={styles["btns-action"]}
          disabled={startDisabled}
          onClick={() => {
            sendHsStart(container.conn);
          }}
        >
          {stage === RoomStage.WAITING ? (
            <>
              <IconFont type="icon-play" size={12} />
              <span>{i18n("StartGame")}</span>
            </>
          ) : stage === RoomStage.HAND_SELECTING ? (
            <>
              <IconFont type="icon-mora" size={20} />
              <span>{i18n("PlsRockPaperScissors")}</span>
            </>
          ) : stage === RoomStage.HAND_SELECTED ? (
            <>
              <LoadingOutlined />
              <span>{i18n("WaitOpponentPlayRockPaperScissors")}</span>
            </>
          ) : stage === RoomStage.TP_SELECTING ? (
            <>
              <IconFont type="icon-one" size={18} />
              <span>{i18n("PlsChooseWhoGoesFirst")}</span>
            </>
          ) : stage === RoomStage.TP_SELECTED ? (
            <>
              <LoadingOutlined />
              <span>{i18n("WaitingForGameToStart")}</span>
            </>
          ) : (
            <>
              <LoadingOutlined />
              <span>{i18n("WaitingForGameToStart")}</span>
            </>
          )}
        </SpecialButton>
      </TpPopover>
    </MoraPopover>
  );
};
