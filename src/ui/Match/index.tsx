import { EditFilled, SettingFilled } from "@ant-design/icons";
import { Space } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { useConfig } from "@/config";
import { accountStore, deckStore, IDeck, roomStore } from "@/stores";
import { Background, IconFont, Select } from "@/ui/Shared";

import styles from "./index.module.scss";
import { MatchModal, matchStore } from "./MatchModal";
import { ReplayModal, replayOpen } from "./ReplayModal";
import { init } from "./util";

const NeosConfig = useConfig();

export const Component: React.FC = () => {
  const serverList = NeosConfig.servers;
  const [server, setServer] = useState(
    `${serverList[0].ip}:${serverList[0].port}`,
  );
  const { decks } = useSnapshot(deckStore);
  const [deck, setDeck] = useState<IDeck>(JSON.parse(JSON.stringify(decks[0])));
  const { user } = useSnapshot(accountStore);
  const { joined } = useSnapshot(roomStore);
  const navigate = useNavigate();

  useEffect(() => {
    // 人机对战跳转
    if (joined) {
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
                  alert(`Deck ${value} not found`);
                }
              }}
              options={decks.map((deck) => ({
                value: deck.deckName,
                label: deck.deckName,
              }))}
            />
          </Space>
          <div className={styles["mode-select"]}>
            <Mode
              title="竞技匹配"
              desc="与世界上其他玩家在线匹配，您的排名将实时显示在排行榜上。"
              icon={<IconFont type="icon-battle" size={32} />}
              onClick={() => alert("开发中，敬请期待")}
            />
            <Mode
              title="休闲匹配"
              desc="使用任意卡组进行对战，将胜负暂且搁置，尽情享受决斗的乐趣。"
              icon={<IconFont type="icon-coffee" size={28} />}
              onClick={() => alert("开发中，敬请期待")}
            />
            <Mode
              title="单人模式"
              desc="开启与AI的决斗，验证自己的卡组，或者只是打发时间。"
              icon={<IconFont type="icon-chip" size={26} />}
              onClick={async () => {
                // TODO: 有时间可以做一个Loading

                // 初始化，然后等待后端通知成功加入房间后跳转页面
                await init({
                  ip: server,
                  player: user?.name ?? "Guest",
                  passWd: "AI",
                });
              }}
            />
            <Mode
              title="自定义房间"
              desc="创建一个自定义的对战房间，便捷地与好友进行对战，甚至是举办一场竞技比赛。"
              icon={<SettingFilled />}
              onClick={() => (matchStore.open = true)}
            />
            <Mode
              title="录像回放"
              desc="自由查看进行过的决斗，回味那些精彩的逆转瞬间。"
              icon={<IconFont type="icon-record" size={24} />}
              onClick={replayOpen}
            />
            <Mode
              title="卡组编辑"
              desc="创建和编辑卡组，在上万种卡片中选择，组建独一无二的构筑。"
              icon={<EditFilled />}
              onClick={() => navigate("/build")}
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
