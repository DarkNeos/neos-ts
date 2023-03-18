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
import { selectCurrentPlayerIsMe } from "../../reducers/duel/turnSlice";

const Config = NeosConfig.ui.status;
const avatarSize = 40;
const ME_VALUE = "myself";
const OP_VALUE = "opponent";

const PlayerStatus = () => {
  const meInfo = useAppSelector(selectMeInitInfo);
  const opInfo = useAppSelector(selectOpInitInfo);
  const myTurn = useAppSelector(selectCurrentPlayerIsMe);

  return (
    <CheckCard.Group
      bordered
      style={{ height: `${NeosConfig.ui.layout.header.height}` }}
      value={myTurn ? ME_VALUE : OP_VALUE}
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

export default PlayerStatus;
