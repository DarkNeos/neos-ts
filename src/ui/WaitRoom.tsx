import {
  CheckCircleFilled,
  LoginOutlined,
  LogoutOutlined,
  SendOutlined,
  TagOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import {
  Avatar,
  Button,
  Checkbox,
  message,
  Modal,
  notification,
  Select,
  Space,
  Upload,
} from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import rustInit from "rust-src";
import { useSnapshot } from "valtio";
import YGOProDeck from "ygopro-deck-encode";

import { initStrings, sendHsReady, sendHsStart, sendUpdateDeck } from "@/api";
import { DeckManager, fetchDeck, type IDeck } from "@/api/deck";
import { useConfig } from "@/config";
import socketMiddleWare, { socketCmd } from "@/middleware/socket";
import sqliteMiddleWare, { sqliteCmd } from "@/middleware/sqlite";
import { chatStore, joinStore, moraStore, playerStore } from "@/stores";

const NeosConfig = useConfig();

const READY_STATE = "ready";

const {
  defaults: { defaultDeck },
  automation: { isAiMode },
} = useConfig();

const WaitRoom = () => {
  const snapJoin = useSnapshot(joinStore);
  const snapChat = useSnapshot(chatStore);
  const snapMora = useSnapshot(moraStore);
  const snapPlayer = useSnapshot(playerStore);

  const params = useParams<{
    player?: string;
    passWd?: string;
    ip?: string;
  }>();

  const [choseDeck, setChoseDeck] = useState<boolean>(false);
  const { player, passWd, ip } = params;

  useEffect(() => {
    if (ip && player && player.length != 0 && passWd && passWd.length != 0) {
      const init = async () => {
        // 初始化wasm
        const url =
          import.meta.env.BASE_URL === "/"
            ? undefined
            : new URL("rust_src_bg.wasm", `${import.meta.env.BASE_URL}assets/`);
        await rustInit(url);

        // 初始化sqlite
        await sqliteMiddleWare({
          cmd: sqliteCmd.INIT,
          initInfo: { dbUrl: NeosConfig.cardsDbUrl },
        });

        // 初始化文案
        await initStrings();

        // 页面第一次渲染时，通过socket中间件向ygopro服务端请求建立长连接
        socketMiddleWare({
          cmd: socketCmd.CONNECT,
          initInfo: {
            ip,
            player,
            passWd,
          },
        });
      };

      init();
    }
  }, []);

  const [api, contextHolder] = notification.useNotification();

  const joined = snapJoin.value;
  const chat = snapChat.message;
  const isHost = snapPlayer.isHost;
  const player0 = snapPlayer.player0;
  const player1 = snapPlayer.player1;
  const duelStart = snapMora.duelStart;

  // FIXME: 这些数据应该从`store`中获取
  // TODO: 云卡组
  const decks = [...DeckManager.keys()].map((deckName) => ({
    value: deckName,
    label: deckName,
  }));
  const [uploadState, setUploadState] = useState("");
  const uploadProps: UploadProps = {
    name: "file",
    onChange(info) {
      if (uploadState != "ERROR") {
        info.file.status = "done";
      }
    },
    beforeUpload(file, _) {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        const ydk = e.target?.result as string;
        const deck = YGOProDeck.fromYdkString(ydk);

        if (
          !(
            deck.main.length === 0 &&
            deck.extra.length === 0 &&
            deck.side.length === 0
          )
        ) {
          // YDK解析成功
          message.success(`${file.name}解析成功`);
          onDeckReady({ deckName: file.name, ...deck });
        } else {
          message.error(`${file.name}解析失败`);
          setUploadState("ERROR");
        }
      };
    },
  };

  const onDeckReady = async (deck: IDeck) => {
    sendUpdateDeck(deck);
    setChoseDeck(true);

    window.myExtraDeckCodes = deck.extra;
  };

  const handleChoseDeck = async (deckName: string) => {
    const deck = await fetchDeck(deckName);
    await onDeckReady(deck);
  };

  const handleChoseReady = () => {
    sendHsReady();
  };

  const handleChoseStart = () => {
    sendHsStart();
  };

  const navigate = useNavigate();

  useEffect(() => {
    if (joined) {
      api.info({ message: "成功加入房间！", placement: "top" });
      /** 如果是开发者模式下的人机对战，应该自动选择卡组，并自动准备和开始 */
      const runAiMode = async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await handleChoseDeck(defaultDeck!);
        handleChoseReady();
        handleChoseStart();
      };
      (async () => {
        if (isAiMode) {
          await runAiMode();
        }
      })();
    }
  }, [joined]);
  useEffect(() => {
    if (chat != "") {
      api.info({ message: "Chat", description: chat, placement: "bottom" });
    }
  }, [chat]);
  useEffect(() => {
    // 若当前玩家是房主并且对战双方都已准备完毕，跳转到猜拳页面；
    // 否则停留在当前页面。
    if (duelStart) {
      navigate(`/mora/${player}/${encodeURIComponent(passWd ?? "")}/${ip}`);
    }
  }, [duelStart]);

  return (
    <>
      <Modal
        title="单局房间"
        open={true}
        maskClosable={false}
        footer={
          <>
            <Space direction="vertical" size={10}>
              <Space wrap size={10}>
                <Avatar size={25} icon={<CheckCircleFilled />} />
                <Button
                  disabled={!(choseDeck && joined)}
                  onClick={handleChoseReady}
                >
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
                <Button onClick={handleChoseStart} disabled={!isHost}>
                  开始游戏
                </Button>
              </Space>
            </Space>
          </>
        }
        onCancel={() => {
          // 断开websocket🔗，
          socketMiddleWare({ cmd: socketCmd.DISCONNECT });
          // 回到初始界面
          navigate("/");
        }}
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
          <Space wrap size={16}>
            <Select
              placeholder="请选择卡组"
              onChange={handleChoseDeck}
              options={decks}
              style={{ width: 160 }}
            />
          </Space>
          <Space>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>
                没有卡组？点击上传YDK文件
              </Button>
            </Upload>
          </Space>
        </Space>
      </Modal>
      {contextHolder}
    </>
  );
};

export default WaitRoom;
