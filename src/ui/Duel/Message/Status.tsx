import { UserOutlined } from "@ant-design/icons";
import { CheckCard } from "@ant-design/pro-components";
import { Avatar } from "antd";
import React from "react";

import { useConfig } from "@/config";

const NeosConfig = useConfig();

const Config = NeosConfig.ui.status;
const avatarSize = 40;
const ME_VALUE = "myself";
const OP_VALUE = "opponent";

import { useSnapshot } from "valtio";

import { matStore } from "@/stores";

export const PlayerStatus = () => {
  const meInfo = useSnapshot(matStore.initInfo.me);
  const opInfo = useSnapshot(matStore.initInfo.op);
  const waiting = useSnapshot(matStore).waiting;

  return (
    <CheckCard.Group
      bordered
      style={{ height: `${NeosConfig.ui.layout.header.height}` }}
      value={waiting ? OP_VALUE : ME_VALUE}
    >
      <CheckCard
        avatar={
          <Avatar
            size={avatarSize}
            style={{ backgroundColor: Config.opAvatarColor }}
            icon={<UserOutlined />}
          />
        }
        title={OP_VALUE}
        description={`Lp: ${opInfo?.life || 0}`}
        value={OP_VALUE}
        style={{
          position: "absolute",
          left: `${NeosConfig.ui.layout.sider.width}px`,
        }}
      />
      <CheckCard
        avatar={
          <Avatar
            size={avatarSize}
            style={{ backgroundColor: Config.meAvatarColor }}
            icon={<UserOutlined />}
          />
        }
        title={ME_VALUE}
        description={`Lp: ${meInfo?.life || 0}`}
        value={ME_VALUE}
        style={{
          position: "absolute",
          right: "0px",
        }}
      />
    </CheckCard.Group>
  );
};
