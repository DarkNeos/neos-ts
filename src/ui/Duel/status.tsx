import React from "react";
import { UserOutlined, BackwardOutlined } from "@ant-design/icons";
import { Avatar, Space, Statistic } from "antd";

const spaceSize = 20;
const avatarSize = 40;

const PlayerStatus = (props: { userName: string; hp: number }) => (
  <Space size={spaceSize} direction="horizontal">
    <Space wrap size={spaceSize}>
      <Avatar size={avatarSize} icon={<UserOutlined />} />
    </Space>
    <Space wrap size={spaceSize}>
      {props.userName}
    </Space>
    <Space wrap size={spaceSize}>
      <Statistic title="Hp" value={props.hp} />
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
