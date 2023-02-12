import { Modal, Checkbox, Avatar, Space, Button, Dropdown } from "antd";
import {
  UserOutlined,
  CheckCircleFilled,
  LoginOutlined,
  LogoutOutlined,
  SendOutlined,
  DownOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

const WaitRoom = () => {
  const items: MenuProps["items"] = [
    {
      label: "卡组1",
      key: "1",
    },
    {
      label: "卡组2",
      key: "2",
    },
    {
      label: "卡组3",
      key: "3",
    },
  ];
  return (
    <Modal
      title="单局房间"
      open={true}
      footer={
        <>
          <Space direction="vertical" size={10}>
            <Space wrap size={10}>
              <Avatar size={25} icon={<CheckCircleFilled />} />
              <Button>决斗准备</Button>
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
              <Button>开始游戏</Button>
            </Space>
          </Space>
        </>
      }
    >
      <Space direction="vertical" size={16}>
        <Space wrap size={16}>
          <Avatar size={30} icon={<UserOutlined />} />
          <Checkbox defaultChecked={false} checked={true} disabled>
            sktt1ryze
          </Checkbox>
        </Space>
        <Space wrap size={16}>
          <Avatar size={30} icon={<UserOutlined />} />
          <Checkbox defaultChecked={false} checked={true} disabled>
            sktt1faker
          </Checkbox>
        </Space>
        <Dropdown menu={{ items, onClick: ({ key }) => {} }}>
          <a onClick={(e) => e.preventDefault()}>
            <Space>
              卡组选择
              <DownOutlined />
            </Space>
          </a>
        </Dropdown>
      </Space>
    </Modal>
  );
};

export default WaitRoom;
