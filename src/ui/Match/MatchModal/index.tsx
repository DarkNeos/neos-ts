import { App, Button, Input, Modal } from "antd";
import React, { ChangeEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { proxy, useSnapshot } from "valtio";

import { sendChat } from "@/api";
import { useConfig } from "@/config";
import { normalizeWebSocketAddress, WebSocketStream } from "@/infra";
import { accountStore, roomStore } from "@/stores";
import { Select } from "@/ui/Shared";

import { connectSrvpro, disconnectSession } from "../util";
import styles from "./index.module.scss";

const NeosConfig = useConfig();
const serverConfig = NeosConfig.servers;

const KOISHI_INDEX = 0;
const PRERELEASE_INDEX = 3;
const ENV_408 = 4;
const CUSTOM_SERVER = -1;
const CUSTOM_SERVER_ADDRESS_KEY = "neos.customServerAddress";

const {
  defaults: { defaultPlayer, defaultPassword },
  automation: { isAiMode },
} = useConfig();

interface Props {
  open?: boolean;
}

const defaultProps: Props = {
  open: false,
};

export const matchStore = proxy<Props>(defaultProps);

export const MatchModal: React.FC = ({}) => {
  const { message } = App.useApp();
  const { open } = useSnapshot(matchStore);
  const { user } = useSnapshot(accountStore);
  const { joined, errorMsg } = useSnapshot(roomStore);
  const [player, setPlayer] = useState(user?.name ?? defaultPlayer);
  const [passwd, setPasswd] = useState(defaultPassword);
  const [serverId, setServerId] = useState(0);
  const [customAddress, setCustomAddress] = useState(() => {
    try {
      return localStorage.getItem(CUSTOM_SERVER_ADDRESS_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [addressError, setAddressError] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const navigate = useNavigate();
  const { t: i18n } = useTranslation("MatchModal");
  const isCustomServer = serverId === CUSTOM_SERVER;
  const serverAddress = isCustomServer
    ? customAddress
    : normalizeWebSocketAddress(genServerAddress(serverId));

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_SERVER_ADDRESS_KEY, customAddress);
    } catch {
      // 浏览器禁用本地存储时，仍可填写地址并连接。
    }
  }, [customAddress]);

  const handlePlayerChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPlayer(event.target.value);
  };
  const handleServerChange = (value: any) => {
    setServerId(value);
    setAddressError("");
  };
  const handlePasswdChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPasswd(event.target.value);
  };
  const send408Hint = (conn: WebSocketStream) => {
    setTimeout(
      () =>
        sendChat(
          conn,
          "由于技术原因，408环境卡池内可用卡牌暂无法直接标出，某些卡片实际使用的是旧效果，例如混沌之黑魔术师、多尔·多拉、死之卡组破坏病毒...",
        ),
      1000,
    );
  };

  const handleSubmit = async () => {
    let address: string;
    try {
      address = normalizeWebSocketAddress(serverAddress);
      setAddressError("");
    } catch (error) {
      setAddressError(
        error instanceof Error ? error.message : "服务器地址格式不正确",
      );
      return;
    }
    setConfirmLoading(true);
    try {
      await connectSrvpro({
        player,
        ip: address,
        passWd: passwd,
        customOnConnected: serverId === ENV_408 ? send408Hint : undefined,
      });
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "连接失败，请重试",
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  useEffect(() => {
    // 如果开启了AI模式，直接进入房间
    if (isAiMode) {
      handleSubmit();
    }
  }, []);

  useEffect(() => {
    // 如果一切顺利的话，后端传来已加入房间的信号，这时候跳转到房间页面
    if (joined) {
      navigate(`/waitroom`);
    }
  }, [joined]);

  useEffect(() => {
    // 出现错误
    if (errorMsg !== undefined && errorMsg !== "") {
      message.error(errorMsg);
      setConfirmLoading(false);
      roomStore.errorMsg = undefined;
    }
  }, [errorMsg]);

  return (
    <Modal
      open={open}
      title={i18n("PleaseEnterCustomRoomInformation")}
      onCancel={() => {
        disconnectSession();
        setConfirmLoading(false);
        matchStore.open = false;
      }}
      footer={
        <Button
          data-testid="match-modal-join"
          onClick={handleSubmit}
          loading={confirmLoading}
        >
          {i18n("JoinRoom")}
        </Button>
      }
      confirmLoading={confirmLoading}
      centered
    >
      <div className={styles["inputs-container"]}>
        <Select
          className={styles.select}
          data-testid="match-modal-server"
          title={i18n("Server")}
          aria-label={i18n("Server")}
          disabled={confirmLoading}
          value={serverId}
          options={[
            {
              value: KOISHI_INDEX,
              label: i18n("KoishiServer"),
            },
            {
              value: PRERELEASE_INDEX,
              label: i18n("UltraPreemptiveServer"),
            },
            {
              value: ENV_408,
              label: i18n("408"),
            },
            {
              value: CUSTOM_SERVER,
              label: i18n("CustomServer"),
            },
          ]}
          onChange={handleServerChange}
        />
        <div className={styles["server-address"]}>
          <label htmlFor="match-server-address">{i18n("ServerAddress")}</label>
          <Input
            id="match-server-address"
            data-testid="match-modal-server-address"
            value={serverAddress}
            readOnly={!isCustomServer}
            disabled={confirmLoading}
            placeholder={i18n("ServerAddressPlaceholder")}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            status={addressError ? "error" : undefined}
            aria-invalid={!!addressError}
            aria-describedby={
              addressError
                ? "match-server-address-error"
                : isCustomServer
                ? "match-server-address-hint"
                : undefined
            }
            onChange={(event) => {
              setCustomAddress(event.target.value);
              setAddressError("");
            }}
          />
          {addressError ? (
            <div
              id="match-server-address-error"
              className={styles["address-error"]}
              role="alert"
            >
              {addressError}
            </div>
          ) : isCustomServer ? (
            <div
              id="match-server-address-hint"
              className={styles["address-hint"]}
            >
              {i18n("CustomServerHint")}
            </div>
          ) : null}
        </div>
        <Input
          className={styles.input}
          data-testid="match-modal-player"
          type="text"
          placeholder={i18n("PlayerNickname")}
          value={player}
          onChange={handlePlayerChange}
          required
        />
        <Input
          className={styles.input}
          data-testid="match-modal-password"
          type="text"
          autoCorrect="off"
          placeholder={i18n("RoomPasswordOptional")}
          value={passwd}
          onChange={handlePasswdChange}
        />
      </div>
    </Modal>
  );
};

const genServerAddress = (id: number) => {
  return `${serverConfig[id].ip}:${serverConfig[id].port}`;
};
