import "../../styles/core.scss";

import { UploadOutlined } from "@ant-design/icons";
import { Button, message, Modal, Upload, UploadProps } from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import rustInit from "rust-src";
import { proxy, useSnapshot } from "valtio";

import { initStrings } from "@/api";
import { useConfig } from "@/config";
import socketMiddleWare, { socketCmd } from "@/middleware/socket";
import sqliteMiddleWare, { sqliteCmd } from "@/middleware/sqlite";
import { matStore } from "@/stores";
const NeosConfig = useConfig();

const localStore = proxy({
  hasStart: false,
});

const ReplayModal: React.FC = () => {
  const { hasStart } = useSnapshot(localStore);
  const [replay, setReplay] = useState<null | ArrayBuffer>(null);
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

  useEffect(() => {
    if (hasStart) {
      // 跳转
      navigate(`/duel/neos/replay/${NeosConfig.replayUrl}`);
    }
  }, [hasStart]);

  return (
    <Modal
      title="选择回放"
      open={true}
      maskClosable={false}
      onOk={async () => {
        if (replay === null) {
          message.error("请先上传录像文件");
        } else {
          // 标记为回放模式
          matStore.isReplay = true;

          // 初始化wasm
          const url =
            import.meta.env.BASE_URL === "/"
              ? undefined
              : new URL(
                  "rust_src_bg.wasm",
                  `${import.meta.env.BASE_URL}assets/`
                );
          await rustInit(url);

          // 初始化额外卡组
          // FIXME: 这样写应该不对，有空来修
          window.myExtraDeckCodes = [];

          // 初始化sqlite
          await sqliteMiddleWare({
            cmd: sqliteCmd.INIT,
            initInfo: { dbUrl: NeosConfig.cardsDbUrl },
          });

          // 初始化文案
          await initStrings();

          // 连接回放websocket服务
          socketMiddleWare({
            cmd: socketCmd.CONNECT,
            isReplay: true,
            replayInfo: {
              Url: NeosConfig.replayUrl,
              data: replay,
            },
          });
        }
      }}
      onCancel={() => {
        // 断开websocket连接
        socketMiddleWare({ cmd: socketCmd.DISCONNECT });
        // 回到初始界面
        navigate("/");
      }}
    >
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />}>点击上传录像文件</Button>
      </Upload>
    </Modal>
  );
};

export const replayStart = () => {
  localStore.hasStart = true;
};

export default ReplayModal;
