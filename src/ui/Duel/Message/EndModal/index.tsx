import { App } from "antd";
import React, { CSSProperties, useState } from "react";
import { useNavigate } from "react-router-dom";
import { proxy, useSnapshot } from "valtio";

import { fetchStrings, Region } from "@/api";
import { getUIContainer } from "@/container/compat";
import { replayStore, resetUniverse, roomStore, trainingStore } from "@/stores";
import { createDuelDialog } from "@/stores/duelDialogs";
import { disconnectSession } from "@/ui/Match/util";

import { NeosModal } from "../NeosModal";
import styles from "./index.module.scss";

interface EndProps {
  isOpen: boolean;
  isWin: boolean;
  reason?: string;
}

const defaultProps: EndProps = {
  isOpen: false,
  isWin: false,
};

export const endModalStore = proxy({ ...defaultProps });

export const EndModal: React.FC = () => {
  const container = getUIContainer();
  const { message } = App.useApp();
  const { isOpen, isWin, reason } = useSnapshot(endModalStore);
  const { isReplay } = useSnapshot(replayStore);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const onReturn = () => {
    if (isReplay) {
      rs();
      return;
    }
    // 训练结果页退出时清理连接并回编辑器，未保存卡组由编辑器状态保留。
    if (trainingStore.session) {
      disconnectSession();
      resetUniverse();
      navigate("/build", { replace: true });
      return;
    }
    // 单局无需等待下一局，主动退出以免被延迟的服务器结束通知留在场上。
    if (roomStore.isSinglePlayer || roomStore.mode === 0) {
      disconnectSession();
      resetUniverse();
      navigate("/match", { replace: true });
      return;
    }
    // 多局保留结算场地，直到换副卡组、整场结束或下一局开局。
    rs();

    if (container.conn.isClosed()) {
      message.info("服务器关闭了连接，返回匹配页。");

      navigate("/match");
    }
  };

  return (
    <NeosModal
      title={fetchStrings(Region.System, 1500)}
      open={isOpen}
      zIndex={3100}
      okText={isReplay ? "继续查看" : "保存录像"}
      cancelText={isReplay ? "关闭" : "不保存"}
      confirmLoading={saving}
      onOk={async () => {
        setSaving(true);
        try {
          if (!isReplay) {
            const complete = container.conn.isClosed()
              ? replayStore.serverReplays >= replayStore.recordedGames
              : await replayStore.waitForServerReplay();
            if (!endModalStore.isOpen) return;
            if (!complete)
              message.info("服务器尚未提供完整卡组，已保存对局过程录像");
            replayStore.download();
          }
          onReturn();
        } finally {
          setSaving(false);
        }
      }}
      onCancel={onReturn}
    >
      <div
        className={styles["end-container"]}
        data-testid="duel-end-modal"
        data-duel-result={isWin ? "win" : "defeated"}
      >
        <p
          className={styles.result}
          data-testid="duel-end-result"
          style={{ "--text-color": isWin ? "blue" : "red" } as CSSProperties}
        >
          {isWin ? "Win" : "Defeated"}
        </p>
        <p className={styles.reason}>{reason}</p>
        {isReplay ? <></> : <p>{fetchStrings(Region.System, 1340)}</p>}
      </div>
    </NeosModal>
  );
};

const dialog = createDuelDialog(
  () => {
    endModalStore.isOpen = false;
    endModalStore.isWin = false;
    endModalStore.reason = undefined;
  },
  undefined,
  true,
);
const rs = dialog.finish;

export const displayEndModal = async (isWin: boolean, reason?: string) => {
  endModalStore.isWin = isWin;
  endModalStore.reason = reason;
  endModalStore.isOpen = true;
  await dialog.wait();
};
