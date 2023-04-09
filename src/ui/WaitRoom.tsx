import {
  Modal,
  Checkbox,
  Avatar,
  Space,
  Button,
  notification,
  Upload,
  message,
  Select,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import socketMiddleWare, { socketCmd } from "@/middleware/socket";
import sqliteMiddleWare, { sqliteCmd } from "@/middleware/sqlite";
import { store } from "@/store";
import {
  selectIsHost,
  selectPlayer0,
  selectPlayer1,
} from "@/reducers/playerSlice";
import { useAppSelector } from "@/hook";
import { useConfig } from "@/config";
import { selectJoined } from "@/reducers/joinSlice";
import { selectChat } from "@/reducers/chatSlice";
import { fetchDeck, type IDeck, DeckManager } from "@/api/deck";
import {
  sendUpdateDeck,
  sendHsReady,
  sendHsStart,
} from "@/api/ocgcore/ocgHelper";
import {
  UserOutlined,
  CheckCircleFilled,
  LoginOutlined,
  LogoutOutlined,
  SendOutlined,
  TagOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { initMeExtraDeckMeta } from "@/reducers/duel/extraDeckSlice";
import type { UploadProps } from "antd";
import { selectDuelStart } from "@/reducers/moraSlice";
import NeosConfig from "../../neos.config.json";
import YGOProDeck from "ygopro-deck-encode";
import rustInit from "rust-src";
import { initStrings } from "@/api/strings";

const READY_STATE = "ready";

const {
  defaults: { defaultDeck },
  automation: { isAiMode },
} = useConfig();

const WaitRoom = () => {
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
          initInfo: { dbUrl: NeosConfig.cardsDbUrl },
        });

        // 初始化文案
        await initStrings();

        // 初始化wasm
        const url =
          import.meta.env.BASE_URL == "/"
            ? undefined
            : new URL("rust_src_bg.wasm", `${import.meta.env.BASE_URL}assets/`);
        await rustInit(url);
      };

      init();
    }
  }, []);

  const dispatch = store.dispatch;
  const joined = useAppSelector(selectJoined);
  const chat = useAppSelector(selectChat);
  const isHost = useAppSelector(selectIsHost);
  const player0 = useAppSelector(selectPlayer0);
  const player1 = useAppSelector(selectPlayer1);
  const duelStart = useAppSelector(selectDuelStart);
  const [api, contextHolder] = notification.useNotification();

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
            deck.main.length == 0 &&
            deck.extra.length == 0 &&
            deck.side.length == 0
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
    await dispatch(
      initMeExtraDeckMeta({ controler: 0, codes: deck.extra?.reverse() || [] })
    );
    setChoseDeck(true);
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
      navigate(`/mora/${player}/${passWd}/${ip}`);
    }
  }, [duelStart]);

  return (
    <>
      <Modal
        title="单局房间"
        open={true}
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
