import React from "react";
import { Timeline } from "antd";
import { UserOutlined, SettingOutlined } from "@ant-design/icons";

const DuelTimeLine = () => <Timeline items={[
  {
    dot: <UserOutlined />,
    children: "对手消息",
    color: "red"
  },
  {
    dot: <UserOutlined />,
    children: "自己消息",
    color: "green"
  },
  {
    dot: <SettingOutlined />,
    children: '系统消息',
  },
]} />;

export default DuelTimeLine;
