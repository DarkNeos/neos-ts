import { ygopro } from "../api/idl/ocgcore";

export enum socketCmd {
  CONNECT,
  DISCONNECT,
  SEND,
}

export interface socketAction {
  cmd: socketCmd;
  ip?: string;
  payload?: ygopro.YgoCtosMsg;
}

let ws: WebSocket | null = null;

export default function (action: socketAction) {
  switch (action.cmd) {
    case socketCmd.CONNECT: {
      const ip = action.ip;
      if (ip) {
        ws = new WebSocket("ws://" + ip);

        ws.onopen = () => {
          console.log("WebSocket open.");
        };
        ws.onclose = () => {
          console.log("WebSocket closed.");
          ws = null;
        };
        ws.onmessage = (e) => {
          const pb = ygopro.YgoStocMsg.deserializeBinary(e.data);

          // todo
        };
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
