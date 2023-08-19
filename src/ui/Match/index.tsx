import {
  EditOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  SettingFilled,
} from "@ant-design/icons";
import { App, Button, Space } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { match } from "@/api";
import { useConfig } from "@/config";
import { accountStore, deckStore, IDeck, roomStore } from "@/stores";
import { Background, IconFont, Select } from "@/ui/Shared";

import styles from "./index.module.scss";
import { MatchModal, matchStore } from "./MatchModal";
import { ReplayModal, replayOpen } from "./ReplayModal";
import { connectSrvpro } from "./util";

const NeosConfig = useConfig();

export const Component: React.FC = () => {
  const { message } = App.useApp();
  const serverList = NeosConfig.servers;
  const [server, setServer] = useState(
    `${serverList[0].ip}:${serverList[0].port}`,
  );
  const { decks } = useSnapshot(deckStore);
  const [deck, setDeck] = useState<IDeck>(JSON.parse(JSON.stringify(decks[0])));
  const user = accountStore.user;
  const { joined } = useSnapshot(roomStore);
  const [singleLoading, setSingleLoading] = useState(false); // 单人模式的loading状态
  const [matchLoading, setMatchLoading] = useState(false);
  const navigate = useNavigate();

  // 竞技匹配
  const onCompetitiveMatch = () => message.error("暂未开放，敬请期待");

  // 娱乐匹配
  const onEntertainMatch = async () => {
    if (!user) {
      message.error("请先登录萌卡账号");
    } else {
      setMatchLoading(true);
      const matchInfo = await match(user.username, user.external_id);

      if (matchInfo) {
        await connectSrvpro({
          ip: matchInfo.address + ":" + (matchInfo.port + 1),
          player: user.username,
          passWd: matchInfo.password,
        });
      } else {
        message.error("匹配失败T_T");
      }
    }
  };

  // 单人模式
  const onAIMatch = async () => {
    setSingleLoading(true);

    // 初始化，然后等待后端通知成功加入房间后跳转页面
    await connectSrvpro({
      ip: server,
      player: user?.name ?? "Guest",
      passWd: "AI",
    });
  };

  // 自定义房间
  const onCustomRoom = () => (matchStore.open = true);

  // 观战列表
  const onWatchList = () => message.error("开发中，敬请期待");

  useEffect(() => {
    if (joined) {
      setSingleLoading(false);
      setMatchLoading(false);
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
              title="服务器"
              showSearch
              value={server}
              style={{ width: 200 }}
              onChange={
                // @ts-ignore
                (value) => setServer(value)
              }
              options={serverList.map((item) => ({
                value: `${item.ip}:${item.port}`,
                label: item.name,
              }))}
            />
            <Select
              title="卡组"
              showSearch
              value={deck.deckName}
              style={{ width: 200 }}
              onChange={(value) => {
                // @ts-ignore
                const item = deckStore.get(value);
                if (item) {
                  setDeck(item);
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
              卡组编辑
            </Button>
          </Space>
          <div className={styles["mode-select"]}>
            <Mode
              title="竞技匹配"
              desc="与天梯其他数万名玩家激战，追求胜利登顶最强。每月最后一天晚上10点结算成绩，获取奖励与公布排名。"
              icon={<IconFont type="icon-battle" size={32} />}
              onClick={onCompetitiveMatch}
            />
            <Mode
              title="娱乐匹配"
              desc="过去一周竞技匹配使用数最靠前的20个卡组被禁止使用。将胜负暂且搁置，尽情享受决斗的乐趣。"
              icon={
                matchLoading ? (
                  <LoadingOutlined />
                ) : (
                  <IconFont type="icon-coffee" size={28} />
                )
              }
              onClick={onEntertainMatch}
            />
            <Mode
              title="单人模式"
              desc="开启与AI的决斗，验证自己的卡组，或者只是打发时间。"
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
              title="自定义房间"
              desc="创建双打TAG或自定义规则的房间，或与好友约战，甚至举办竞技比赛。"
              icon={<SettingFilled />}
              onClick={onCustomRoom}
            />
            <Mode
              title="录像回放"
              desc="自由查看进行过的决斗，回味那些精彩的逆转瞬间。"
              icon={<IconFont type="icon-record" size={24} />}
              onClick={replayOpen}
            />
            <Mode
              title="观战列表"
              desc="观看MyCard上正在进行的决斗"
              icon={<PlayCircleOutlined />}
              onClick={onWatchList}
            />
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
    <div className={styles.icon}>{icon}</div>
    <div className={styles.title}>{title}</div>
    <div className={styles.desc}>{desc}</div>
  </div>
);
