/*
 * Socket中间件
 *
 * 所有长连接/Websocket相关的逻辑都应该收敛在这里。
 *
 * */
import { WebSocketStream } from "@/infra";

import handleSocketOpen from "../service/onSocketOpen";

// FIXME: 应该有个返回值，告诉业务方本次请求的结果。比如建立长连接失败。
export function initSocket(initInfo: {
  ip: string;
  player: string;
  passWd: string;
  customOnConnected?: (conn: WebSocketStream) => void;
}): WebSocketStream {
  const { ip, player, passWd, customOnConnected } = initInfo;
  return new WebSocketStream(ip, (conn, _event) => {
    handleSocketOpen(conn, ip, player, passWd);
    customOnConnected && customOnConnected(conn);
  });
}

export function initReplaySocket(replayInfo: {
  url: string; // 提供回放服务的地址
  data: ArrayBuffer; // 回放数据
}): WebSocketStream {
  const { url, data } = replayInfo;
  return new WebSocketStream(url, (conn, _event) => {
    console.info("replay websocket open.");
    conn.ws.binaryType = "arraybuffer";
    conn.ws.send(data);
  });
}

export function sendSocketData(conn: WebSocketStream, payload: Uint8Array) {
  conn.ws.send(payload);
}

export function closeSocket(conn: WebSocketStream) {
  conn.close();
}
