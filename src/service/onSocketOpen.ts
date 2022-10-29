/*
 * 长连接建立事件订阅处理逻辑
 *
 * */
import { sendJoinGame, sendPlayerInfo } from "../api/ocgcore/ocgHelper";

/*
 * 长连接建立后，需要马上发送PlayerInfo和JoinGame两个数据包，
 * 否则ygopro服务端超过2s后会自动断连。
 *
 * */
export default function handleSocketOpen(
  ws: WebSocket | null,
  ip: string,
  player: string,
  passWd: string
) {
  console.log("WebSocket opened.");

  if (ws && ws.readyState == 1) {
    ws.binaryType = "arraybuffer";

    sendPlayerInfo(ws, player);
    sendJoinGame(ws, 4947, passWd); // todo: version use config
  }
}
