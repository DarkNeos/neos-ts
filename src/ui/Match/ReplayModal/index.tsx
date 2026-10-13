import { Button, message, Modal, type UploadProps } from "antd";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { proxy, useSnapshot } from "valtio";

import { useEnv } from "@/hook";
import { replayImport } from "@/service/replayImport";
import type { ReplayImportOptions } from "@/stores/replayImportSession";
import { openReplayDecks, ReplayDecks } from "@/ui/Shared/ReplayDecks";

import { Uploader } from "../../Shared";

const localStore = proxy({ open: false });

export const ReplayModal: React.FC = () => {
  const { open } = useSnapshot(localStore);
  const { hasFile, busy, progress, error, started } = useSnapshot(
    replayImport.state,
  );
  const { t: i18n } = useTranslation("ReplayModal");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { DEV } = useEnv();
  const recordName = searchParams.get("record");

  useEffect(() => () => replayImport.cancel(), []);
  useEffect(() => {
    if (error) message.error(error);
  }, [error]);
  useEffect(() => {
    if (!started) return;
    localStore.open = false;
    replayImport.cancel();
    navigate(
      recordName
        ? `/duel?${new URLSearchParams({ record: recordName })}`
        : "/duel",
    );
  }, [started]);

  useEffect(() => {
    if (!DEV || !recordName) return;
    let cancelled = false;
    import(
      /* @vite-ignore */ `../../../../neos-assets/records/${recordName}.yrp3d?arraybuffer`
    )
      .then((res) => {
        if (!cancelled) return launchReplay(res.default);
      })
      .catch(() => console.error(`Local record '${recordName}' not found`));
    return () => {
      cancelled = true;
    };
  }, []);

  const uploadProps: UploadProps = {
    name: "replay",
    onChange(info) {
      info.file.status = "done";
    },
    accept: ".yrp3d,.yrp,.yrp2",
    beforeUpload(file) {
      void replayImport.select(file);
      return false;
    },
  };

  return (
    <>
      <ReplayDecks />
      <Modal
        title={i18n("SelectReplay")}
        open={open}
        maskClosable={false}
        confirmLoading={busy}
        centered
        footer={
          <>
            <Button
              disabled={!hasFile}
              loading={busy}
              onClick={async () => {
                if (await replayImport.run("extract")) openReplayDecks();
              }}
            >
              提取卡组
            </Button>
            <Button
              disabled={!hasFile}
              loading={busy}
              onClick={() => {
                void replayImport.run("play");
              }}
            >
              {i18n("StartReplay")}
            </Button>
          </>
        }
        onCancel={() => {
          replayImport.cancel();
          localStore.open = false;
        }}
      >
        <Uploader
          {...uploadProps}
          text={i18n("ClickOrDragFilesHereToUpload")}
          hint={i18n("SupportsReplayExtensions", {
            defaultValue: "支持 .yrp3d、.yrp 和 .yrp2 录像",
          })}
        />
        {busy && progress && <div role="status">{progress}</div>}
      </Modal>
    </>
  );
};

export const replayOpen = () => {
  localStore.open = true;
};

/** 开发入口也使用同一导入会话，接受文件替换与取消规则。 */
export const launchReplay = async (
  data: ArrayBuffer,
  options: ReplayImportOptions = {},
) => {
  if (options.signal?.aborted) return false;
  void replayImport.select(data);
  const completed = await replayImport.run("play", options);
  if (!completed && replayImport.state.error)
    throw new Error(replayImport.state.error);
  return completed;
};
