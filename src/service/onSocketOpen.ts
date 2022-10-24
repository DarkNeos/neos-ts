import { sendJoinGame, sendPlayerInfo } from "../api/ocgcore/ocgHelper";

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
