import { App, Button, Input, Modal } from "antd";
import React, { ChangeEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { proxy, useSnapshot } from "valtio";

import { useConfig } from "@/config";
import { accountStore, roomStore } from "@/stores";
import { Select } from "@/ui/Shared";

import { connectSrvpro } from "../util";
import styles from "./index.module.scss";
import { useTranslation } from "react-i18next";

const NeosConfig = useConfig();
const serverConfig = NeosConfig.servers;

const KOISHI_INDEX = 0;
const PRERELEASE_INDEX = 3;

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
  const [confirmLoading, setConfirmLoading] = useState(false);
  const navigate = useNavigate();
  const { t: i18n } = useTranslation("MatchModal");

  const handlePlayerChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPlayer(event.target.value);
  };
  const handleServerChange = (value: any) => {
    setServerId(value);
  };
  const handlePasswdChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPasswd(event.target.value);
  };

  const handleSubmit = async () => {
    setConfirmLoading(true);
    await connectSrvpro({
      player,
      ip: genServerAddress(serverId),
      passWd: passwd,
    });
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
      onCancel={() => (matchStore.open = false)}
      footer={
        <Button onClick={handleSubmit} loading={confirmLoading}>
          {i18n("JoinRoom")}
        </Button>
      }
      confirmLoading={confirmLoading}
      centered
    >
      <div className={styles["inputs-container"]}>
        <Select
          className={styles.select}
          title={i18n("Server")}
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
          ]}
          onChange={handleServerChange}
        />
        <Input
          className={styles.input}
          type="text"
          placeholder={i18n("PlayerNickname")}
          value={player}
          onChange={handlePlayerChange}
          required
        />
        <Input
          className={styles.input}
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
