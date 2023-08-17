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
import socketMiddleWare, { socketCmd } from "@/middleware/socket";
import PlayerState = ygopro.StocHsPlayerChange.State;
import SelfType = ygopro.StocTypeChange.SelfType;
import { Avatar, Button, Skeleton, Space } from "antd";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { useConfig } from "@/config";
import {
  accountStore,
  deckStore,
  IDeck,
  Player,
  resetUniverse,
  RoomStage,
  roomStore,
} from "@/stores";
import { Background, IconFont, Select, SpecialButton } from "@/ui/Shared";

import { Chat } from "./Chat";
import styles from "./index.module.scss";
import { Mora, MoraPopover, Tp, TpPopover } from "./Popover";

const NeosConfig = useConfig();

export const Component: React.FC = () => {
  const { user } = useSnapshot(accountStore);
  const [collapsed, setCollapsed] = useState(false);
  const { decks } = useSnapshot(deckStore);
  const [deck, setDeck] = useState<IDeck>(JSON.parse(JSON.stringify(decks[0])));
  const room = useSnapshot(roomStore);
  const me = room.getMePlayer();
  const op = room.getOpPlayer();
  const navigate = useNavigate();

  useEffect(() => {
    if (room.stage === RoomStage.DUEL_START) {
      // 决斗开始，跳转决斗页面
      navigate("/duel");
      // TODO: 重置房间状态(也可能是在这个页面的loader之中重置，就看是进房间重置还是离开时重置，可能需要考虑意外离开的情况)
    }
  }, [room.stage]);

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
          <Controller
            onDeckChange={(deckName: string) => {
              const deck = deckStore.get(deckName);
              // 同步后端
              if (deck) {
                setDeck(deck);
              } else {
                alert(`Deck ${deckName} not found`);
              }
            }}
          />
          <div className={styles["both-side-container"]}>
            <PlayerZone
              who={Who.Me}
              player={me}
              avatar={user?.avatar_url}
              btn={
                room.stage === RoomStage.WAITING ? (
                  <Button
                    size="large"
                    className={styles["btn-join"]}
                    onClick={() => {
                      if (me?.state === PlayerState.NO_READY) {
                        sendUpdateDeck(deck);
                        window.myExtraDeckCodes = [...deck.extra];
                        sendHsReady();
                      } else {
                        sendHsNotReady();
                      }
                    }}
                  >
                    {me?.state === PlayerState.NO_READY
                      ? "决斗准备"
                      : "取消准备"}
                  </Button>
                ) : (
                  <MoraAvatar
                    mora={
                      me?.moraResult !== undefined &&
                      me.moraResult !== HandType.UNKNOWN
                        ? Object.values(Mora)[me.moraResult - 1]
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
                  btn={
                    room.stage === RoomStage.WAITING ? null : (
                      <MoraAvatar
                        mora={
                          op?.moraResult !== undefined &&
                          op.moraResult !== HandType.UNKNOWN
                            ? Object.values(Mora)[op.moraResult - 1]
                            : undefined
                        }
                      />
                    )
                  }
                />
              ))}
          </div>
          <ActionButton
            onMoraSelect={(mora) => {
              sendHandResult(mora);
              roomStore.stage = RoomStage.HAND_SELECTED;
            }}
            onTpSelect={(tp) => {
              sendTpResult(tp === Tp.First);
              roomStore.stage = RoomStage.TP_SELECTED;
            }}
          />
        </div>
      </div>
    </div>
  );
};

enum Who {
  Me = "me",
  Op = "op",
}

// 玩家区域: 双方各有一个
const PlayerZone: React.FC<{
  btn?: React.ReactNode; // 在内部右侧可以放一个按钮
  who?: Who;
  player?: Player;
  avatar?: string; // 因为对手的头像目前不清楚如何获取，因此暂时这里作为一个参数传入
}> = ({ btn, who, player, avatar }) => {
  return (
    <div className={classNames(styles["side-box"], who && styles[who])}>
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
  <div style={{ marginLeft: "auto" }}>
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

const Controller: React.FC<{ onDeckChange: (deckName: string) => void }> = ({
  onDeckChange,
}) => {
  const snapDeck = useSnapshot(deckStore);
  const snapRoom = useSnapshot(roomStore);
  return (
    <Space>
      <Select
        title="卡组"
        showSearch
        style={{ width: 250 }}
        defaultValue={snapDeck.decks[0].deckName}
        options={snapDeck.decks.map((deck) => ({
          value: deck.deckName,
          title: deck.deckName,
        }))}
        onChange={
          // @ts-ignore
          (value) => onDeckChange(value)
        }
      />
      <Button
        size="large"
        icon={<IconFont type="icon-record" size={18} />}
        onClick={() => {
          if (snapRoom.selfType !== SelfType.OBSERVER) {
            sendHsToObserver();
          } else {
            sendHsToDuelList();
          }
        }}
      >
        {snapRoom.selfType === SelfType.OBSERVER ? "加入决斗者" : "加入观战"}
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
  return (
    <div className={styles["btns-side"]}>
      <Button
        className={styles["btn"]}
        danger
        icon={
          <span className={styles["btn-icon"]}>
            <IconFont type="icon-exit" size={17} />
            <span className={styles["btn-text"]}>&#20;&#20;退出房间</span>
          </span>
        }
        onClick={() => {
          // 断开websocket🔗，
          socketMiddleWare({ cmd: socketCmd.DISCONNECT });
          // 重置stores
          resetUniverse();
          // 返回上一个路由
          navigate("/match");
        }}
      />
      <Button
        className={styles["btn"]}
        icon={
          <span className={styles["btn-icon"]}>
            <IconFont type="icon-side-bar-fill" size={16} />
            <span className={styles["btn-text"]}>
              &#20;&#20;{collapsed ? "展开" : "收起"}侧栏
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
  const room = useSnapshot(roomStore);
  const { stage, isHost } = room;
  return (
    <MoraPopover onSelect={onMoraSelect}>
      <TpPopover onSelect={onTpSelect}>
        <SpecialButton
          className={styles["btns-action"]}
          disabled={
            stage !== RoomStage.WAITING ||
            (stage === RoomStage.WAITING &&
              (!isHost ||
                room.getMePlayer()?.state !== PlayerState.READY ||
                room.getOpPlayer()?.state !== PlayerState.READY))
          }
          onClick={() => {
            sendHsStart();
          }}
        >
          {stage === RoomStage.WAITING ? (
            <>
              <IconFont type="icon-play" size={12} />
              开始游戏
            </>
          ) : stage === RoomStage.HAND_SELECTING ? (
            <>
              <IconFont type="icon-mora" size={20} />
              <span>请猜拳</span>
            </>
          ) : stage === RoomStage.HAND_SELECTED ? (
            <>
              <LoadingOutlined />
              <span>等待对方猜拳</span>
            </>
          ) : stage === RoomStage.TP_SELECTING ? (
            <>
              <IconFont type="icon-one" size={18} />
              <span>请选择先后手</span>
            </>
          ) : stage === RoomStage.TP_SELECTED ? (
            <>
              <LoadingOutlined />
              <span>等待游戏开始</span>
            </>
          ) : (
            <></>
          )}
        </SpecialButton>
      </TpPopover>
    </MoraPopover>
  );
};
