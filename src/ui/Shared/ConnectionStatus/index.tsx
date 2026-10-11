import { Alert, Button, Space } from "antd";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { initStore, replayStore, resetUniverse, trainingStore } from "@/stores";
import { connectionStore } from "@/stores/connectionStore";
import { endModalStore } from "@/ui/Duel/Message/EndModal";
import { initializeApp } from "@/ui/Layout/utils";
import { checkSessionConnection, disconnectSession } from "@/ui/Match/util";

import { SaveReplayButton } from "../SaveReplayButton";
import styles from "./index.module.scss";

const labels = {
  matching: "正在等待匹配结果",
  initializing: "正在准备对局资源",
  connecting: "正在连接服务器",
  joining: "已连接，等待服务器确认房间",
};

export const ConnectionStatus = () => {
  const state = useSnapshot(connectionStore);
  const init = useSnapshot(initStore);
  const { isOpen: resultOpen } = useSnapshot(endModalStore);
  const { session: training, savingReplay } = useSnapshot(trainingStore);
  const { t } = useTranslation("BuildDeck");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const inSession = ["/duel", "/waitroom", "/side"].includes(pathname);
  useEffect(() => {
    let hidden = document.hidden;
    const network = () => checkSessionConnection();
    const returned = () => {
      checkSessionConnection();
      if (connectionStore.phase === "connected")
        connectionStore.returnedFromBackground = true;
    };
    const visibility = () => {
      if (document.hidden) hidden = true;
      else if (hidden) {
        hidden = false;
        returned();
      }
    };
    const pageshow = (event: PageTransitionEvent) => {
      if (event.persisted) returned();
    };
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    window.addEventListener("focus", network);
    window.addEventListener("pageshow", pageshow);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
      window.removeEventListener("focus", network);
      window.removeEventListener("pageshow", pageshow);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const busy = state.phase in labels;
  const failed = state.phase === "error" || state.phase === "disconnected";
  if (
    savingReplay ||
    (!busy &&
      !failed &&
      !state.offline &&
      !init.error &&
      !(state.returnedFromBackground && inSession))
  )
    return null;
  const leave = () => {
    // disconnectSession 会清除训练标记，因此先决定失败或取消后的返回位置。
    const destination = trainingStore.session ? "/build" : "/match";
    disconnectSession();
    resetUniverse();
    navigate(destination, { replace: destination === "/build" });
  };
  return createPortal(
    <>
      {inSession && !resultOpen && (failed || state.offline) && (
        <div className={styles.blocker} data-testid="session-unavailable" />
      )}
      <aside
        className={styles.status}
        data-testid="connection-status"
        data-phase={state.phase}
        aria-live="polite"
      >
        <Alert
          showIcon
          type={failed || state.offline || init.error ? "warning" : "info"}
          message={
            state.offline
              ? "网络不可用，请检查网络连接"
              : init.error
              ? `资源初始化失败：${init.error}`
              : busy
              ? labels[state.phase as keyof typeof labels]
              : failed
              ? state.message
              : "已返回对局，请查看当前操作提示和剩余时间"
          }
          action={
            <Space wrap>
              {failed && !replayStore.isReplay && <SaveReplayButton />}
              {init.error && (
                <Button
                  loading={init.loading}
                  onClick={() =>
                    void initializeApp()
                      .then(() => {
                        if (!inSession) connectionStore.set("idle");
                      })
                      .catch(() => undefined)
                  }
                >
                  重新加载资源
                </Button>
              )}
              {(busy || failed || (inSession && state.offline)) && (
                <Button onClick={leave}>
                  {training
                    ? t("TrainingReturnToEditor")
                    : busy
                    ? "取消连接"
                    : inSession
                    ? "返回大厅"
                    : "返回重试"}
                </Button>
              )}
              {!busy && !failed && !state.offline && !init.error && (
                <Button
                  onClick={() => {
                    connectionStore.returnedFromBackground = false;
                  }}
                >
                  知道了
                </Button>
              )}
            </Space>
          }
        />
      </aside>
    </>,
    document.body,
  );
};
