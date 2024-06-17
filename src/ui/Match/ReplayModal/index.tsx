import { Button, message, Modal, type UploadProps } from "antd";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { proxy, useSnapshot } from "valtio";

import { useEnv } from "@/hook";
import { replayStore } from "@/stores";

import { Uploader } from "../../Shared";
import { connectSrvpro } from "../util";

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

      await launchReplay(replay);
    }
  };

  // 开发时的回放模式：路径跳转到duel
  const [searchParams] = useSearchParams();
  const { DEV } = useEnv();
  const recordName = searchParams.get("record");

  // 如处于回放模式且有回放文件，则导入播放
  useEffect(() => {
    if (!DEV) return;
    if (recordName) {
      import(
        /* @vite-ignore */ `../../../../neos-assets/records/${recordName}.yrp3d?arraybuffer`
      )
        .then((res) => launchReplay(res.default))
        .catch(() => console.error(`Local record '${recordName}' not found`));
    }
  }, []);

  useEffect(() => {
    if (hasStart) {
      setLoading(false);
      localStore.open = false;
      localStore.hasStart = false;
      // 跳转
      navigate(recordName ? `/duel?record=${recordName}` : "/duel");
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

/** 单独抽离出来，以便可以在 Match.tsx 中调用，跳过Modal直接加载回放，便于开发 */
export const launchReplay = async (replayData: ArrayBuffer) => {
  // 标记为回放模式
  replayStore.isReplay = true;

  await connectSrvpro({
    ip: "",
    player: "",
    passWd: "",
    replay: true,
    replayData,
  });
};
