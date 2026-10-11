import { CloseCircleFilled } from "@ant-design/icons";
import { App, Button, Modal } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { sendSurrender } from "@/api";
import { getUIContainer } from "@/container/compat";
import { matStore, replayStore, resetUniverse, trainingStore } from "@/stores";
import { endModalStore } from "@/ui/Duel/Message/EndModal";
import { disconnectSession } from "@/ui/Match/util";

export const TrainingExitButton = () => {
  const [open, setOpen] = useState(false);
  const { savingReplay } = useSnapshot(trainingStore);
  const { message } = App.useApp();
  const { t } = useTranslation("BuildDeck");
  const navigate = useNavigate();
  const leave = () => {
    setOpen(false);
    disconnectSession();
    resetUniverse();
    navigate("/build", { replace: true });
  };
  const saveAndLeave = async () => {
    const session = trainingStore.session;
    if (!session || trainingStore.savingReplay) return;
    const conn = getUIContainer().conn;
    trainingStore.savingReplay = true;
    try {
      // 先结束训练，让服务器生成完整录像；收到数据前保留连接和当前记录。
      if (!conn.isClosed() && !matStore.duelEnd && !endModalStore.isOpen)
        sendSurrender(conn);
      const complete = conn.isClosed()
        ? replayStore.serverReplays >= replayStore.recordedGames
        : await replayStore.waitForServerReplay();
      // 浏览器返回或新会话已替换本次训练时，不再下载或跳转。
      if (trainingStore.session !== session) return;
      replayStore.download();
      if (!complete) message.info("服务器尚未提供完整卡组，已保存训练过程录像");
      leave();
    } catch {
      if (trainingStore.session === session)
        message.error("录像保存失败，请重试或直接退出");
    } finally {
      if (trainingStore.session === session) trainingStore.savingReplay = false;
    }
  };

  return (
    <>
      <Button
        data-testid="training-return-editor"
        icon={<CloseCircleFilled />}
        type="text"
        onClick={() => setOpen(true)}
      >
        {t("TrainingReturnToEditor")}
      </Button>
      <Modal
        title="退出训练"
        open={open}
        centered
        zIndex={3200}
        closable={!savingReplay}
        maskClosable={!savingReplay}
        keyboard={!savingReplay}
        onCancel={() => setOpen(false)}
        footer={[
          <Button
            key="continue"
            disabled={savingReplay}
            onClick={() => setOpen(false)}
          >
            继续训练
          </Button>,
          <Button
            key="leave"
            data-testid="training-exit-discard"
            disabled={savingReplay}
            onClick={leave}
          >
            直接退出
          </Button>,
          <Button
            key="save"
            data-testid="training-exit-save"
            type="primary"
            loading={savingReplay}
            onClick={() => void saveAndLeave()}
          >
            保存录像并退出
          </Button>,
        ]}
      >
        <p>
          {savingReplay
            ? "正在结束训练并保存录像…"
            : "可将本次训练录像保存到本机，再返回卡组编辑器。"}
        </p>
      </Modal>
    </>
  );
};
