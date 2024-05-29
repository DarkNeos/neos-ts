import {
  BulbOutlined,
  EditOutlined,
  LoadingOutlined,
  PlayCircleFilled,
  SettingFilled,
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
  match,
} from "@/api";
import { useConfig } from "@/config";
import { accountStore, deckStore, resetUniverse, roomStore } from "@/stores";
import { Background, IconFont, ScrollableArea, Select } from "@/ui/Shared";

import {
  CustomRoomContent,
  CustomRoomFooter,
  mcCustomRoomStore,
} from "./CustomRoomContent";
import styles from "./index.module.scss";
import { MatchModal, matchStore } from "./MatchModal";
import { ReplayModal, replayOpen } from "./ReplayModal";
import { connectSrvpro } from "./util";
import { WatchContent, watchStore } from "./WatchContent";

const { servers: serverList } = useConfig();

export const loader: LoaderFunction = () => {
  // 在加载这个页面之前先重置一些store，清掉上局游戏遗留的数据
  resetUniverse();
  return null;
};

export const Component: React.FC = () => {
  const { message, modal } = App.useApp();
  const server = `${serverList[0].ip}:${serverList[0].port}`;
  const { decks } = deckStore;
  const [deckName, setDeckName] = useState(decks.at(0)?.deckName ?? "");
  const user = accountStore.user;
  const { joined } = useSnapshot(roomStore);
  const [singleLoading, setSingleLoading] = useState(false); // 单人模式的loading状态
  const [athleticMatchLoading, setAthleticMatchLoading] = useState(false); // 竞技匹配的loading状态
  const [entertainMatchLoading, setEntertainMatchLoading] = useState(false); // 娱乐匹配的loading状态
  const [watchLoading, setWatchLoading] = useState(false); // 观战模式的loading状态
  const navigate = useNavigate();
  const { t: i18n } = useTranslation("Match");

  // 匹配
  const onMatch = async (arena: "athletic" | "entertain") => {
    if (!user) {
      message.error("请先登录萌卡账号");
    } else {
      arena === "athletic"
        ? setAthleticMatchLoading(true)
        : setEntertainMatchLoading(true);
      const matchInfo = await match(user.username, user.external_id, arena);

      if (matchInfo) {
        await connectSrvpro({
          ip: matchInfo.address + ":" + (matchInfo.port + 1), // 分配给Neos的Websocket端口是TCP端口+1
          player: user.username,
          passWd: matchInfo.password,
        });
      } else {
        message.error("匹配失败T_T");
      }
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
    if (user) {
      const mcServer = serverList.find(
        (server) => server.name === "mycard-custom",
      );
      if (mcServer) {
        const passWd = getCreateRoomPasswd(
          mcCustomRoomStore.options,
          String(getPrivateRoomID(user.external_id)),
          user.external_id,
          true,
        );
        await connectSrvpro({
          ip: mcServer.ip + ":" + mcServer.port,
          player: user.username,
          passWd,
        });
      }
    }
  };
  // 加入MC自定义房间
  const onJoinMCRoom = async () => {
    if (user) {
      if (mcCustomRoomStore.friendPrivateID !== undefined) {
        const mcServer = serverList.find(
          (server) => server.name === "mycard-custom",
        );
        if (mcServer) {
          const passWd = getJoinRoomPasswd(
            String(mcCustomRoomStore.friendPrivateID),
            user.external_id,
            true,
          );
          await connectSrvpro({
            ip: mcServer.ip + ":" + mcServer.port,
            player: user.username,
            passWd,
          });
        }
      } else {
        message.error("请输入朋友的私密房间密码！");
      }
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
          if (watchStore.watchID) {
            setWatchLoading(true);

            // 找到MC竞技匹配的Server
            const mcServer = serverList.find(
              (server) => server.name === "mycard-athletic",
            );
            if (mcServer) {
              const passWd = getJoinRoomPasswd(
                watchStore.watchID,
                user.external_id,
              );
              await connectSrvpro({
                ip: mcServer.ip + ":" + mcServer.port,
                player: user.username,
                passWd,
              });
            } else {
              message.error(
                "Something unexpected happened, please contact <ccc@neos.moe> to fix",
              );
            }
          } else {
            message.error(`${i18n("PleaseSelectTheRoomToSpectate")}`);
          }
        },
        centered: true,
        maskClosable: true,
        content: <WatchContent />,
      });
    }
  };

  // 单人模式
  const onAIMatch = async () => {
    setSingleLoading(true);

    // 初始化，然后等待后端通知成功加入房间后跳转页面
    await connectSrvpro({
      ip: server,
      player: user?.username ?? "Guest",
      passWd: "AI",
    });
  };

  // 自定义房间
  const onCustomRoom = () => (matchStore.open = true);

  useEffect(() => {
    if (joined) {
      setSingleLoading(false);
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
            <Select
              title={i18n("Deck")}
              showSearch
              value={deckName}
              style={{ width: 200 }}
              onChange={(value) => {
                // @ts-ignore
                const item = deckStore.get(value);
                if (item) {
                  setDeckName(item.deckName);
                } else {
                  message.error(`Deck ${value} not found`);
                }
              }}
              options={decks.map((deck) => ({
                value: deck.deckName,
                label: deck.deckName,
              }))}
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
              onClick={onAIMatch}
            />
            <Mode
              title={i18n("CustomRoomTitle")}
              desc={i18n("CustomRoomDesc")}
              icon={<SettingFilled />}
              onClick={onCustomRoom}
            />
            <Mode
              title={i18n("ReplayTitle")}
              desc={i18n("ReplayDesc")}
              icon={<IconFont type="icon-record" size={24} />}
              onClick={replayOpen}
            />
            <Mode title={i18n("WIPTitle")} desc={i18n("WIPDesc")} icon={null} />
          </div>
        </div>
      </div>
      <MatchModal />
      <ReplayModal />
    </>
  );
};
Component.displayName = "Match";

const Mode: React.FC<{
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick?: () => void;
}> = ({ title, desc, icon, onClick }) => (
  <div className={styles.mode} onClick={onClick}>
    <ScrollableArea maxHeight="15rem">
      <div className={styles.icon}>{icon}</div>
      <div className={styles.title}>{title}</div>
      <div className={styles.desc}>{desc}</div>
    </ScrollableArea>
  </div>
);
