import { Button, message, Modal, UploadProps } from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { proxy, useSnapshot } from "valtio";

import { replayStore } from "@/stores";

import { Uploader } from "../../Shared";
import { connectSrvpro } from "../util";
import { useTranslation } from "react-i18next";

const localStore = proxy({
  open: false,
  hasStart: false,
});

export const ReplayModal: React.FC = () => {
  const { open, hasStart } = useSnapshot(localStore);
  const [replay, setReplay] = useState<null | ArrayBuffer>(null);
  const [loading, setLoading] = useState(false);
  const { t: i18n } = useTranslation("ReplayModal");
  const uploadProps: UploadProps = {
    name: "replay",
    onChange(info) {
      info.file.status = "done";
    },
    accept: ".yrp3d",
    beforeUpload(file, _) {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);

      reader.onload = (e) => setReplay(e.target?.result as ArrayBuffer);
    },
  };

  const navigate = useNavigate();
  const onSubmit = async () => {
    if (replay === null) {
      message.error(`${i18n("PleaseUploadReplayFile")}`);
    } else {
      setLoading(true);

      // 标记为回放模式
      replayStore.isReplay = true;

      await connectSrvpro({
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
      title={i18n("SelectReplay")}
      open={open}
      maskClosable={false}
      confirmLoading={loading}
      centered
      footer={
        <Button onClick={onSubmit} loading={loading}>
          {i18n("StartReplay")}
        </Button>
      }
      onCancel={() => (localStore.open = false)}
    >
      <Uploader
        {...uploadProps}
        text={i18n("ClickOrDragFilesHereToUpload")}
        hint={i18n("SupportsYrd3dExtension")}
      />
    </Modal>
  );
};

export const replayOpen = () => {
  localStore.open = true;
};

export const replayStart = () => {
  localStore.hasStart = true;
};
