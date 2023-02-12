import { Modal, Checkbox, Avatar, Space, Button, Dropdown, Tag } from "antd";
import React, { useState, useEffect } from "react";
import socketMiddleWare, { socketCmd } from "../middleware/socket";
import sqliteMiddleWare, { sqliteCmd } from "../middleware/sqlite";
import { store } from "../store";
import {
  selectIsHost,
  selectPlayer0,
  selectPlayer1,
  selectObserverCount,
} from "../reducers/playerSlice";
import { useAppSelector } from "../hook";
import { selectJoined } from "../reducers/joinSlice";
import { selectChat } from "../reducers/chatSlice";
import { fetchDeck } from "../api/deck";
import {
  sendUpdateDeck,
  sendHsReady,
  sendHsStart,
} from "../api/ocgcore/ocgHelper";
import {
  UserOutlined,
  CheckCircleFilled,
  LoginOutlined,
  LogoutOutlined,
  SendOutlined,
  DownOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { initMeExtraDeckMeta } from "../reducers/duel/extraDeckSlice";
import type { MenuProps } from "antd";
import { Link, useParams } from "react-router-dom";

const READY_STATE = "ready";

const WaitRoom = () => {
  const params = useParams<{
    player?: string;
    passWd?: string;
    ip?: string;
  }>();

  const [choseDeck, setChoseDeck] = useState<boolean>(false);
  const { player, passWd, ip } = params;

  const dispatch = store.dispatch;
  const isHost = useAppSelector(selectIsHost);
  const player0 = useAppSelector(selectPlayer0);
  const player1 = useAppSelector(selectPlayer1);

  const handleChoseDeck = async () => {
    const deck = await fetchDeck("hero");

    sendUpdateDeck(deck);
    dispatch(initMeExtraDeckMeta({ controler: 0, codes: deck.extra || [] }));

    setChoseDeck(true);
  };

  const handleChoseReady = () => {
    sendHsReady();
  };

  const handleChoseStart = () => {
    sendHsStart();
  };
  const items: MenuProps["items"] = [
    {
      label: "卡组1",
      key: "1",
    },
    {
      label: "卡组2",
      key: "2",
    },
    {
      label: "卡组3",
      key: "3",
    },
  ];

  useEffect(() => {
    if (ip && player && player.length != 0 && passWd && passWd.length != 0) {
      const init = async () => {
        // 页面第一次渲染时，通过socket中间件向ygopro服务端请求建立长连接
        socketMiddleWare({
          cmd: socketCmd.CONNECT,
          initInfo: {
            ip,
            player,
            passWd,
          },
        });

        // 初始化sqlite
        await sqliteMiddleWare({
          cmd: sqliteCmd.INIT,
          initInfo: { dbUrl: "/ygopro-database/locales/zh-CN/cards.cdb" },
        });
      };

      init();
    }
  }, []);

  return (
    <Modal
      title="单局房间"
      open={true}
      footer={
        <>
          <Space direction="vertical" size={10}>
            <Space wrap size={10}>
              <Avatar size={25} icon={<CheckCircleFilled />} />
              <Button disabled={!choseDeck} onClick={handleChoseReady}>
                决斗准备
              </Button>
            </Space>
            <Space wrap size={10}>
              <Avatar size={25} icon={<LoginOutlined />} />
              <Button>到决斗者</Button>
            </Space>
            <Space wrap size={10}>
              <Avatar size={25} icon={<LogoutOutlined />} />
              <Button>到旁观者</Button>
            </Space>
            <Space wrap size={10}>
              <Avatar size={25} icon={<SendOutlined />} />
              <Button onClick={handleChoseStart}>
                <Link
                  to={
                    // 若当前玩家是房主并且对战双方都已准备完毕，跳转到猜拳页面；
                    // 否则停留在当前页面。
                    !isHost ||
                    player0.state !== READY_STATE ||
                    player1.state !== READY_STATE
                      ? {}
                      : { pathname: `/mora` }
                  }
                >
                  开始游戏
                </Link>
              </Button>
            </Space>
          </Space>
        </>
      }
    >
      <Space direction="vertical" size={16}>
        <Space wrap size={16}>
          <Avatar size={30} icon={<UserOutlined />} />
          <Checkbox
            defaultChecked={false}
            checked={player0.state === READY_STATE}
            disabled
          >
            {player0.name}
          </Checkbox>
          {player0.isHost === true ? (
            <Avatar size={30} icon={<TagOutlined />} />
          ) : (
            <></>
          )}
        </Space>
        <Space wrap size={16}>
          <Avatar size={30} icon={<UserOutlined />} />
          <Checkbox
            defaultChecked={false}
            checked={player1.state === READY_STATE}
            disabled
          >
            {player1.name}
          </Checkbox>
          {player1.isHost === true ? (
            <Avatar size={30} icon={<TagOutlined />} />
          ) : (
            <></>
          )}
        </Space>
        <Dropdown menu={{ items, onClick: ({ key }) => {} }}>
          <a onClick={(e) => e.preventDefault()}>
            <Space>
              卡组选择
              <DownOutlined />
            </Space>
          </a>
        </Dropdown>
      </Space>
    </Modal>
  );
};

export default WaitRoom;
