import handleSocketOpen from "../service/onSocketOpen";
import handleSocketMessage from "../service/onSocketMessage";

export enum socketCmd {
  CONNECT,
  DISCONNECT,
  SEND,
}

export interface socketAction {
  cmd: socketCmd;
  initInfo?: {
    ip: string;
    player: string;
    passWd: string;
  };
  payload?: Uint8Array;
}

let ws: WebSocket | null = null;

export default function (action: socketAction) {
  switch (action.cmd) {
    case socketCmd.CONNECT: {
      const info = action.initInfo;
      if (info) {
        ws = new WebSocket("ws://" + info.ip);

        ws.onopen = () => {
          handleSocketOpen(ws, info.ip, info.player, info.passWd);
        };
        ws.onclose = () => {
          console.log("WebSocket closed.");
          ws = null;
        };
        ws.onmessage = handleSocketMessage;
      }

      break;
    }
    case socketCmd.DISCONNECT: {
      if (ws) {
        ws.close();
      }

      break;
    }
    case socketCmd.SEND: {
      const payload = action.payload;
      if (ws && payload) {
        ws.send(payload);
      }

      break;
    }
    default: {
      console.log("Unhandled socket command: " + action.cmd);

      break;
    }
  }
}
