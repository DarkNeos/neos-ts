/*
 * Socket中间件
 *
 * 所有长连接/Websocket相关的逻辑都应该收敛在这里。
 *
 * */
import { adaptStoc } from "@/api/ocgcore/ocgAdapter/adapter";
import { YgoProPacket } from "@/api/ocgcore/ocgAdapter/packet";
import { CTOS_RESPONSE } from "@/api/ocgcore/ocgAdapter/protoDecl";
import { yrp3dToStocGameMsgBuffers } from "@/api/ocgcore/replay";
import { LocalReplayStream, WebSocketStream } from "@/infra";
import type { SocketState } from "@/infra/stream";
import { matStore, replayStore, resetDuel } from "@/stores";
import { connectionStore } from "@/stores/connectionStore";
import { resetDuelDialogs } from "@/stores/duelDialogs";

import handleSocketOpen from "../service/onSocketOpen";

// FIXME: 应该有个返回值，告诉业务方本次请求的结果。比如建立长连接失败。
export function initSocket(initInfo: {
  ip: string;
  player: string;
  passWd: string;
  customOnConnected?: (conn: WebSocketStream) => void;
  onState?: (state: SocketState, message?: string) => void;
}): WebSocketStream {
  const { ip, player, passWd, customOnConnected } = initInfo;
  return new WebSocketStream(
    ip,
    (conn, _event) => {
      handleSocketOpen(conn, ip, player, passWd);
      customOnConnected && customOnConnected(conn);
    },
    initInfo.onState,
    (event) => {
      if (!replayStore.isReplay)
        YgoProPacket.deserialize(event.data).forEach((packet) =>
          replayStore.record(packet),
        );
    },
  );
}

export function initReplaySocket(replayInfo: {
  data: ArrayBuffer; // 回放数据
}): WebSocketStream {
  const { data } = replayInfo;
  const messages = yrp3dToStocGameMsgBuffers(data);
  replayStore.setTimeline(
    messages.map(
      (buffer) =>
        adaptStoc(YgoProPacket.deserialize(buffer)[0]).stoc_game_msg.gameMsg,
    ),
  );
  return new LocalReplayStream(messages, () => {
    resetDuel();
    replayStore.game = 0;
  }) as unknown as WebSocketStream;
}

export function sendSocketData(conn: WebSocketStream, payload: Uint8Array) {
  if (conn.cancelled) return false;
  if (!navigator.onLine) {
    connectionStore.offline = true;
    return false;
  }
  if (conn.ws.readyState !== WebSocket.OPEN) {
    conn.close();
    replayStore.archive();
    resetDuelDialogs(true);
    matStore.stopClock();
    connectionStore.set("disconnected", "连接已断开，操作尚未发送");
    return false;
  }
  try {
    conn.ws.send(payload);
    if (payload[2] === CTOS_RESPONSE) {
      matStore.stopClock();
      matStore.clearPhaseCommands();
    }
    return true;
  } catch {
    conn.close();
    replayStore.archive();
    resetDuelDialogs(true);
    matStore.stopClock();
    connectionStore.set("error", "发送失败，请检查连接状态");
    return false;
  }
}

export function closeSocket(conn: WebSocketStream) {
  conn.close();
}
