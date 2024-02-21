import { App, Button, Input, Modal } from "antd";
import React, { ChangeEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { proxy, useSnapshot } from "valtio";

import { useConfig } from "@/config";
import { accountStore, roomStore } from "@/stores";
import { Select } from "@/ui/Shared";

import styles from "./MatchModal.module.scss";
import { connectSrvpro } from "./util";

const NeosConfig = useConfig();
const serverConfig = NeosConfig.servers;

const KOISHI = "koishi";
const PRERELEASE = "pre-release";

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

  let handlePlayerChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPlayer(event.target.value);
  };
  let handleServerChange = (value: any) => {
    switch (value) {
      case KOISHI: {
        setServerId(0);
        break;
      }
      case PRERELEASE: {
        setServerId(2);
        break;
      }
      default:
        break;
    }
  };
  let handlePasswdChange = (event: ChangeEvent<HTMLInputElement>) => {
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
      title="请输入自定义房间信息"
      onCancel={() => (matchStore.open = false)}
      footer={
        <Button onClick={handleSubmit} loading={confirmLoading}>
          加入房间
        </Button>
      }
      confirmLoading={confirmLoading}
      centered
    >
      <div className={styles["inputs-container"]}>
        <Select
          className={styles.select}
          title="服务器"
          value={KOISHI}
          options={[
            {
              value: KOISHI,
              label: "Koishi服",
            },
            {
              value: PRERELEASE,
              label: "超先行服",
            },
          ]}
          onChange={handleServerChange}
        />
        <Input
          className={styles.input}
          type="text"
          placeholder="玩家昵称"
          value={player}
          onChange={handlePlayerChange}
          required
        />
        <Input
          className={styles.input}
          type="text"
          autoCorrect="off"
          placeholder="房间密码(可选)"
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
