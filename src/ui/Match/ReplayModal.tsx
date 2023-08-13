import { UploadOutlined } from "@ant-design/icons";
import { Button, message, Modal, Upload, UploadProps } from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { proxy, useSnapshot } from "valtio";

import { matStore } from "@/stores";

import { init } from "./util";

const localStore = proxy({
  open: false,
  hasStart: false,
});

export const ReplayModal: React.FC = () => {
  const { open, hasStart } = useSnapshot(localStore);
  const [replay, setReplay] = useState<null | ArrayBuffer>(null);
  const [loading, setLoading] = useState(false);
  const uploadProps: UploadProps = {
    name: "replay",
    onChange(info) {
      info.file.status = "done";
    },
    beforeUpload(file, _) {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);

      reader.onload = (e) => setReplay(e.target?.result as ArrayBuffer);
    },
  };

  const navigate = useNavigate();
  const onSubmit = async () => {
    if (replay === null) {
      message.error("请先上传录像文件");
    } else {
      setLoading(true);

      // 标记为回放模式
      matStore.isReplay = true;

      // 初始化额外卡组
      // FIXME: 这样写应该不对，有空来修
      window.myExtraDeckCodes = [];

      await init({
        ip: "",
        player: "",
        passWd: "",
        replay: true,
        replayData: replay,
      });
    }
  };

  useEffect(() => {
    if (hasStart) {
      setLoading(false);
      localStore.open = false;
      localStore.hasStart = false;
      // 跳转
      navigate(`/duel`);
    }
  }, [hasStart]);

  return (
    <Modal
      title="选择回放"
      open={open}
      maskClosable={false}
      confirmLoading={loading}
      centered
      footer={
        <Button onClick={onSubmit} loading={loading}>
          开始回放
        </Button>
      }
      onCancel={() => (localStore.open = false)}
    >
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />}>点击上传录像文件</Button>
      </Upload>
    </Modal>
  );
};

export const replayOpen = () => {
  localStore.open = true;
};

export const replayStart = () => {
  localStore.hasStart = true;
};
