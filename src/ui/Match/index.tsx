import {
  BulbOutlined,
  EditOutlined,
  LoadingOutlined,
  PlayCircleFilled,
  SettingFilled,
  SkinOutlined,
} from "@ant-design/icons";
import { App, Button, Modal, Space } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoaderFunction, useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import {
  getCreateRoomPasswd,
  getJoinRoomPasswd,
  getPrivateRoomID,
  getUserU16Secret,
  match,
} from "@/api";
import { useConfig } from "@/config";
import { AudioActionType, changeScene } from "@/infra/audio";
import { accountStore, resetUniverse, roomStore } from "@/stores";
import { connectionStore } from "@/stores/connectionStore";
import { Background, IconFont, ScrollableArea } from "@/ui/Shared";
import { DeckLibraryPicker } from "@/ui/Shared/DeckLibraryPicker";
import { SaveReplayButton } from "@/ui/Shared/SaveReplayButton";

import { Appearance } from "./Appearance";
import {
  CustomRoomContent,
  CustomRoomFooter,
  mcCustomRoomStore,
} from "./CustomRoomContent";
import styles from "./index.module.scss";
import { MatchModal, matchStore } from "./MatchModal";
import { ReplayModal, replayOpen } from "./ReplayModal";
import { connectSrvpro, disconnectSession } from "./util";
import { WatchContent, watchStore } from "./WatchContent";

const { servers: serverList } = useConfig();

export const loader: LoaderFunction = () => {
  // 在加载这个页面之前先重置一些store，清掉上局游戏遗留的数据
  disconnectSession();
  resetUniverse();
  // 更新当前场景
  changeScene(AudioActionType.BGM_MENU);
  return null;
};

export const Component: React.FC = () => {
  const { message, modal } = App.useApp();
  const user = accountStore.user;
  const { joined } = useSnapshot(roomStore);
  const { phase: connectionPhase } = useSnapshot(connectionStore);
  useEffect(() => {
    if (["idle", "error", "disconnected"].includes(connectionPhase)) {
      setSingleLoading(false);
      setAthleticMatchLoading(false);
      setEntertainMatchLoading(false);
      setWatchLoading(false);
    }
  }, [connectionPhase]);
  const [singleLoading, setSingleLoading] = useState<
    "koishi" | "pre-release" | false
  >(false);
  const [singleOpen, setSingleOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [athleticMatchLoading, setAthleticMatchLoading] = useState(false); // 竞技匹配的loading状态
  const [entertainMatchLoading, setEntertainMatchLoading] = useState(false); // 娱乐匹配的loading状态
  const [watchLoading, setWatchLoading] = useState(false); // 观战模式的loading状态
  const navigate = useNavigate();
  const { t: i18n } = useTranslation("Match");
  const { t: roomI18n } = useTranslation("MatchModal");

  // 匹配
  const onMatch = async (arena: "athletic" | "entertain") => {
    if (!user) {
      message.error("请先登录萌卡账号");
      return;
    }

    try {
      arena === "athletic"
        ? setAthleticMatchLoading(true)
        : setEntertainMatchLoading(true);

      // 每次匹配前都要重新获取 u16Secret，因为它会按时间轮换
      const u16Secret = await getUserU16Secret(user.token);
      const matchInfo = await match(user.username, u16Secret, arena);

      if (matchInfo) {
        await connectSrvpro({
          ip: matchInfo.address + ":" + (matchInfo.port + 1), // 分配给Neos的Websocket端口是TCP端口+1
          player: user.username,
          passWd: matchInfo.password,
        });
      } else {
        message.error("匹配失败T_T");
        arena === "athletic"
          ? setAthleticMatchLoading(false)
          : setEntertainMatchLoading(false);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "未知错误";
      message.error(errorMsg);
      arena === "athletic"
        ? setAthleticMatchLoading(false)
        : setEntertainMatchLoading(false);
    }
  };

  // 竞技匹配
  const onCompetitiveMatch = async () => await onMatch("athletic");

  // 娱乐匹配
  const onEntertainMatch = async () => await onMatch("entertain");

  // MC自定义房间
  const onMCCustomRoom = () => {
    if (!user) {
      message.error("请先登录萌卡账号");
    } else {
      modal.info({
        icon: null,
        centered: true,
        maskClosable: true,
        content: <CustomRoomContent />,
        footer: (
          <CustomRoomFooter
            onCreateRoom={onCreateMCRoom}
            onJoinRoom={onJoinMCRoom}
          />
        ),
      });
    }
  };

  // 创建MC自定义房间
  const onCreateMCRoom = async () => {
    if (!user) {
      return;
    }

    try {
      const mcServer = serverList.find(
        (server) => server.name === "mycard-custom",
      );
      if (mcServer) {
        // 每次操作前都要重新获取 u16Secret
        const u16Secret = await getUserU16Secret(user.token);
        const passWd = getCreateRoomPasswd(
          mcCustomRoomStore.options,
          String(getPrivateRoomID(user.external_id)),
          u16Secret,
          true,
        );
        await connectSrvpro({
          ip: mcServer.ip + ":" + mcServer.port,
          player: user.username,
          passWd,
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "未知错误";
      message.error(errorMsg);
    }
  };
  // 加入MC自定义房间
  const onJoinMCRoom = async () => {
    if (!user) {
      return;
    }

    if (mcCustomRoomStore.friendPrivateID === undefined) {
      message.error("请输入朋友的私密房间密码！");
      return;
    }

    try {
      const mcServer = serverList.find(
        (server) => server.name === "mycard-custom",
      );
      if (mcServer) {
        // 每次操作前都要重新获取 u16Secret
        const u16Secret = await getUserU16Secret(user.token);
        const passWd = getJoinRoomPasswd(
          String(mcCustomRoomStore.friendPrivateID),
          u16Secret,
          true,
        );
        await connectSrvpro({
          ip: mcServer.ip + ":" + mcServer.port,
          player: user.username,
          passWd,
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "未知错误";
      message.error(errorMsg);
    }
  };

  // MC观战
  const onMCWatch = () => {
    if (!user) {
      message.error("请先登录萌卡账号");
    } else {
      modal.info({
        icon: null,
        width: "40vw",
        okText: i18n("EnterSpectatorMode"),
        onOk: async () => {
          if (!watchStore.watchID) {
            message.error(`${i18n("PleaseSelectTheRoomToSpectate")}`);
            return;
          }

          try {
            setWatchLoading(true);

            // 找到MC竞技匹配的Server
            const mcServer = serverList.find(
              (server) => server.name === "mycard-athletic",
            );
            if (mcServer) {
              // 每次操作前都要重新获取 u16Secret
              const u16Secret = await getUserU16Secret(user.token);
              const passWd = getJoinRoomPasswd(watchStore.watchID, u16Secret);
              await connectSrvpro({
                ip: mcServer.ip + ":" + mcServer.port,
                player: user.username,
                passWd,
              });
            } else {
              message.error(
                "Something unexpected happened, please contact <ccc@neos.moe> to fix",
              );
              setWatchLoading(false);
            }
          } catch (error) {
            const errorMsg =
              error instanceof Error ? error.message : "未知错误";
            message.error(errorMsg);
            setWatchLoading(false);
          }
        },
        centered: true,
        maskClosable: true,
        content: <WatchContent />,
      });
    }
  };

  // 单人模式
  const onAIMatch = async (serverName: "koishi" | "pre-release") => {
    if (singleLoading) return;
    setSingleLoading(serverName);

    // 初始化，然后等待后端通知成功加入房间后跳转页面
    try {
      const server = serverList.find((server) => server.name === serverName);
      if (!server) throw new Error("未配置所选服务器，请检查服务器配置");
      await connectSrvpro({
        ip: `${server.ip}:${server.port}`,
        player: user?.username ?? "Guest",
        passWd: "AI",
        singlePlayer: true,
      });
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "连接失败，请重试",
      );
    } finally {
      setSingleLoading(false);
    }
  };

  // 自定义房间
  const onCustomRoom = () => (matchStore.open = true);

  useEffect(() => {
    if (joined) {
      setSingleLoading(false);
      setSingleOpen(false);
      setAthleticMatchLoading(false);
      setEntertainMatchLoading(false);
      setWatchLoading(false);
      Modal.destroyAll(); // 销毁当前所有modal
      navigate(`/waitroom`);
    }
  }, [joined]);

  return (
    <>
      <Background />
      <div className={styles.container}>
        <div className={styles.wrap}>
          <Space size={16}>
            <DeckLibraryPicker
              testId="match-deck-select"
              title={i18n("Deck")}
              style={{ width: 200 }}
            />
            <Button
              style={{ width: 150 }}
              icon={<EditOutlined />}
              onClick={() => navigate("/build")}
              size="large"
            >
              {i18n("DeckEdit")}
            </Button>
          </Space>
          <SaveReplayButton previous />
          <div className={styles["mode-select"]}>
            <Mode
              title={i18n("MCCompetitiveMatchmakingTitle")}
              desc={i18n("MCCompetitiveMatchmakingDesc")}
              icon={
                athleticMatchLoading ? (
                  <LoadingOutlined />
                ) : (
                  <IconFont type="icon-battle" size={32} />
                )
              }
              onClick={onCompetitiveMatch}
            />
            <Mode
              title={i18n("MCCasualMatchmakingTitle")}
              desc={i18n("MCCasualMatchmakingDesc")}
              icon={
                entertainMatchLoading ? (
                  <LoadingOutlined />
                ) : (
                  <IconFont type="icon-coffee" size={28} />
                )
              }
              onClick={onEntertainMatch}
            />
            <Mode
              title={i18n("MCCustomRoomTitle")}
              desc={i18n("MCCustomRoomDesc")}
              icon={<BulbOutlined />}
              testId="match-mode-mc-custom-room"
              onClick={onMCCustomRoom}
            />
            <Mode
              title={i18n("MCSpectatorListTitle")}
              desc={i18n("MCSpectatorListDesc")}
              icon={watchLoading ? <LoadingOutlined /> : <PlayCircleFilled />}
              onClick={onMCWatch}
            />
            <Mode
              title={i18n("SinglePlayerModeTitle")}
              desc={i18n("SinglePlayerModeDesc")}
              icon={
                singleLoading ? (
                  <LoadingOutlined />
                ) : (
                  <IconFont type="icon-chip" size={26} />
                )
              }
              testId="match-mode-single-player"
              onClick={() => setSingleOpen(true)}
            />
            <Mode
              title={i18n("CustomRoomTitle")}
              desc={i18n("CustomRoomDesc")}
              icon={<SettingFilled />}
              testId="match-mode-custom-room"
              onClick={onCustomRoom}
            />
            <Mode
              title={i18n("ReplayTitle")}
              desc={i18n("ReplayDesc")}
              icon={<IconFont type="icon-record" size={24} />}
              testId="match-mode-replay"
              onClick={replayOpen}
            />
            <Mode
              title="外观"
              desc="选择双方的卡背图案，为主卡组与额外卡组分别设置卡套。"
              icon={<SkinOutlined />}
              testId="match-mode-appearance"
              onClick={() => setAppearanceOpen(true)}
            />
            <Mode title={i18n("WIPTitle")} desc={i18n("WIPDesc")} icon={null} />
          </div>
        </div>
      </div>
      <Modal
        open={singleOpen}
        title={i18n("SinglePlayerModeTitle")}
        width="24rem"
        centered
        onCancel={() => {
          disconnectSession();
          setSingleLoading(false);
          setSingleOpen(false);
        }}
        footer={null}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Button
            data-testid="single-player-server"
            data-server="koishi"
            block
            size="large"
            disabled={!!singleLoading}
            loading={singleLoading === "koishi"}
            onClick={() => onAIMatch("koishi")}
          >
            {roomI18n("KoishiServer")} (7210)
          </Button>
          <Button
            data-testid="single-player-server"
            data-server="pre-release"
            block
            size="large"
            disabled={!!singleLoading}
            loading={singleLoading === "pre-release"}
            onClick={() => onAIMatch("pre-release")}
          >
            {roomI18n("UltraPreemptiveServer")}
          </Button>
        </Space>
      </Modal>
      <MatchModal />
      <ReplayModal />
      <Appearance
        open={appearanceOpen}
        onClose={() => setAppearanceOpen(false)}
      />
    </>
  );
};
Component.displayName = "Match";

const Mode: React.FC<{
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick?: () => void;
  testId?: string;
}> = ({ title, desc, icon, onClick, testId }) => (
  <div className={styles.mode} data-testid={testId} onClick={onClick}>
    <ScrollableArea maxHeight="15rem">
      <div className={styles.icon}>{icon}</div>
      <div className={styles.title}>{title}</div>
      <div className={styles.desc}>{desc}</div>
    </ScrollableArea>
  </div>
);
