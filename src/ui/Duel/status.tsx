import React from "react";
import { UserOutlined } from "@ant-design/icons";
import { Avatar } from "antd";
import { CheckCard } from "@ant-design/pro-components";
import NeosConfig from "../../../neos.config.json";
import { useAppSelector } from "../../hook";
import {
  selectMeInitInfo,
  selectOpInitInfo,
} from "../../reducers/duel/initInfoSlice";

const Config = NeosConfig.ui.status;
const avatarSize = 40;

const PlayerStatus = () => {
  const meInfo = useAppSelector(selectMeInitInfo);
  const opInfo = useAppSelector(selectOpInitInfo);

  return (
    <CheckCard.Group
      bordered
      style={{ height: `${NeosConfig.ui.layout.header.height}` }}
    >
      <CheckCard
        avatar={
          <Avatar
            size={avatarSize}
            style={{ backgroundColor: Config.opAvatarColor }}
            icon={<UserOutlined />}
          />
        }
        title={`opponent`}
        description={`Hp: ${opInfo?.life || 0}`}
        value="opponent"
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
        title={`myself`}
        description={`Hp: ${meInfo?.life || 0}`}
        value="myself"
        style={{
          position: "absolute",
          right: "0px",
        }}
      />
    </CheckCard.Group>
  );
};

export default PlayerStatus;
