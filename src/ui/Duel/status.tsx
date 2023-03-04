import React from "react";
import { UserOutlined, BackwardOutlined } from "@ant-design/icons";
import { Avatar, Space, Statistic } from "antd";

const spaceSize = 20;
const avatarSize = 40;

const PlayerStatus = () => (
  <Space size={spaceSize} direction="horizontal">
    <Space wrap size={spaceSize}>
      <Avatar size={avatarSize} icon={<UserOutlined />} />
    </Space>
    <Space wrap size={spaceSize}>
      UserName
    </Space>
    <Space wrap size={spaceSize}>
      <Statistic title="Hp" value={4000} />
    </Space>
    <Space wrap size={spaceSize}>
      <Avatar
        size={avatarSize}
        style={{ color: "red" }}
        icon={<BackwardOutlined />}
      />
    </Space>
  </Space>
);

export default PlayerStatus;
