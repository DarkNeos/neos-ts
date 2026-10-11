import { subscribe } from "valtio";

import { getUIContainer, initUIContainer } from "@/container/compat";
import { WebSocketStream } from "@/infra";
import { initReplaySocket, initSocket } from "@/middleware/socket";
import { pollSocketLooper } from "@/service/executor";
import {
  matStore,
  replayStore,
  resetUniverse,
  roomStore,
  type TrainingSession,
  trainingStore,
} from "@/stores";
import { connectionStore } from "@/stores/connectionStore";
import { resetDuelDialogs } from "@/stores/duelDialogs";

import { initializeApp } from "../Layout/utils";

// 退出或新建连接时递增；资源加载和旧连接回调只能更新所属的当前会话。
let attempt = 0;
let activeConnection: WebSocketStream | undefined;

export function disconnectSession() {
  attempt += 1;
  replayStore.archive();
  activeConnection?.close();
  activeConnection = undefined;
  // 离开或重连时一并清除训练错误和自动准备标记。
  trainingStore.reset();
  resetDuelDialogs();
  matStore.stopClock();
  connectionStore.set("idle");
}

export function checkSessionConnection() {
  connectionStore.offline = !navigator.onLine;
  if (activeConnection?.isClosed() && connectionStore.phase === "connected") {
    replayStore.archive();
    resetDuelDialogs(true);
    matStore.stopClock();
    connectionStore.set("disconnected", "连接已断开，请返回大厅重新进入");
  }
}

// WebSocket 建立仅表示传输可用，还需等入房回包和训练规则校验通过。
function waitForRoom(conn: WebSocketStream, token: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = (error?: string) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      stopRoom();
      stopConnection();
      error ? reject(new Error(error)) : resolve();
    };
    const inspect = () => {
      if (token !== attempt) return finish("已取消连接");
      if (roomStore.errorMsg) return finish(roomStore.errorMsg);
      if (["error", "disconnected", "idle"].includes(connectionStore.phase)) {
        return finish(connectionStore.message || "连接已关闭");
      }
      if (roomStore.joined) finish();
    };
    const stopRoom = subscribe(roomStore, inspect, true);
    const stopConnection = subscribe(connectionStore, inspect, true);
    const timer = setTimeout(() => {
      conn.close();
      finish("服务器尚未确认加入房间，请检查房间信息后重试");
    }, 20_000);
    inspect();
  });
}

function waitForReplayStart(
  conn: WebSocketStream,
  token: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = (error?: string) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      stopReplay();
      stopConnection();
      error ? reject(new Error(error)) : resolve();
    };
    const inspect = () => {
      if (token !== attempt) return finish("已取消回放");
      if (connectionStore.phase === "error")
        return finish(connectionStore.message || "录像启动失败");
      if (replayStore.playbackReady) finish();
    };
    const stopReplay = subscribe(replayStore, inspect, true);
    const stopConnection = subscribe(connectionStore, inspect, true);
    const timer = setTimeout(() => {
      conn.close();
      finish("录像没有完成开局，请重试");
    }, 20_000);
    inspect();
  });
}

/** 建立独立会话并等待服务端确认入房；false 表示该次连接已被取消。 */
export const connectSrvpro = async (params: {
  ip: string;
  player: string;
  passWd: string;
  replay?: boolean;
  replayData?: ArrayBuffer;
  customOnConnected?: (conn: WebSocketStream) => void;
  training?: TrainingSession;
  signal?: AbortSignal;
}): Promise<boolean> => {
  if (params.signal?.aborted) return false;
  disconnectSession();
  // 必须先结束旧会话再保存训练快照，避免旧连接的清理覆盖新状态。
  if (params.training) {
    resetUniverse();
    trainingStore.start(params.training);
  }
  const token = attempt;
  const abort = () => {
    if (token === attempt) disconnectSession();
  };
  params.signal?.addEventListener("abort", abort, { once: true });
  roomStore.joined = false;
  roomStore.timeLimit = null;
  roomStore.errorMsg = undefined;
  connectionStore.set("initializing");
  try {
    await initializeApp();
    if (token !== attempt) return false;
    if (!params.replay && !navigator.onLine)
      throw new Error("当前网络不可用，请联网后重试");
    const conn =
      params.replay && params.replayData
        ? initReplaySocket({ data: params.replayData })
        : initSocket({
            ...params,
            onState: (state, message) => {
              if (token !== attempt) return;
              if (state === "open") connectionStore.set("joining");
              else {
                replayStore.archive();
                if (state !== "closed") activeConnection?.close();
                resetDuelDialogs(true);
                matStore.stopClock();
                connectionStore.set(
                  // 训练校验失败后关闭连接时，优先保留具体错误而非普通断线提示。
                  state === "closed" && !trainingStore.error
                    ? "disconnected"
                    : "error",
                  trainingStore.error || message,
                );
              }
            },
          });
    activeConnection = conn;
    initUIContainer(conn);
    connectionStore.set(params.replay ? "idle" : "connecting");
    void pollSocketLooper(getUIContainer()).catch((error) => {
      if (token !== attempt) return;
      conn.close();
      replayStore.archive();
      resetDuelDialogs(true);
      matStore.stopClock();
      connectionStore.set(
        "error",
        error instanceof Error ? error.message : "对局数据处理失败，请返回大厅",
      );
    });
    if (!params.replay) {
      // 先启动消息消费再等待入房，否则 joined 和服务器错误无法被处理。
      await conn.opened;
      if (token !== attempt) return false;
      await waitForRoom(conn, token);
      if (token === attempt) connectionStore.set("connected");
    } else await waitForReplayStart(conn, token);
    // 即使网络连接成功，被用户取消或新连接替代的请求也不能触发页面跳转。
    return token === attempt;
  } catch (error) {
    if (token !== attempt) return false;
    activeConnection?.close();
    matStore.stopClock();
    connectionStore.set(
      "error",
      error instanceof Error ? error.message : "连接失败，请重试",
    );
    throw error;
  } finally {
    params.signal?.removeEventListener("abort", abort);
  }
};
