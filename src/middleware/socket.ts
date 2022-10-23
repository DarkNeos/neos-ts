import { ygopro } from "../api/ocgcore/idl/ocgcore";
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
  payload?: ygopro.YgoCtosMsg;
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
      const pb = action.payload;
      if (ws && pb) {
        ws.send(pb.serialize());
      }

      break;
    }
    default: {
      console.log("Unhandled socket command: " + action.cmd);

      break;
    }
  }
}
