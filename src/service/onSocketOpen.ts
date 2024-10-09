/*
 * 长连接建立事件订阅处理逻辑
 *
 * */
import { sendJoinGame, sendPlayerInfo } from "@/api";
import { useConfig } from "@/config";
import { WebSocketStream } from "@/infra";

const NeosConfig = useConfig();
/*
 * 长连接建立后，需要马上发送PlayerInfo和JoinGame两个数据包，
 * 否则ygopro服务端超过2s后会自动断连。
 *
 * */
export default function handleSocketOpen(
  conn: WebSocketStream | undefined,
  _ip: string,
  player: string,
  passWd: string,
) {
  console.log("WebSocket opened.");

  if (conn && conn.ws.readyState === 1) {
    conn.ws.binaryType = "arraybuffer";

    sendPlayerInfo(conn.ws, player);
    sendJoinGame(conn.ws, NeosConfig.version, passWd);
  }
}
