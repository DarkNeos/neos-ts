/*
 * Socket中间件
 *
 * 所有长连接/Websocket相关的逻辑都应该收敛在这里。
 *
 * */
import { WebSocketStream } from "@/infra";

import handleSocketMessage from "../service/onSocketMessage";
import handleSocketOpen from "../service/onSocketOpen";

export enum socketCmd {
  // 建立长连接
  CONNECT,
  // 断开长连接
  DISCONNECT,
  // 通过长连接发送数据
  SEND,
}

export interface socketAction {
  cmd: socketCmd;
  // 创建长连接需要业务方传入的数据
  initInfo?: {
    ip: string;
    player: string;
    passWd: string;
  };
  isReplay?: boolean; // 是否是回放模式
  replayInfo?: {
    Url: string; // 提供回放服务的地址
    data: ArrayBuffer; // 回放数据
  };
  // 通过长连接发送的数据
  payload?: Uint8Array;
}

let ws: WebSocketStream | null = null;

// FIXME: 应该有个返回值，告诉业务方本次请求的结果。比如建立长连接失败。
export default async function (action: socketAction) {
  switch (action.cmd) {
    case socketCmd.CONNECT: {
      const { initInfo: info, isReplay, replayInfo } = action;
      if (info) {
        ws = new WebSocketStream(info.ip, (conn, _event) =>
          handleSocketOpen(conn, info.ip, info.player, info.passWd),
        );

        await ws.execute(handleSocketMessage);
      } else if (isReplay && replayInfo) {
        ws = new WebSocketStream(replayInfo.Url, (conn, _event) => {
          console.info("replay websocket open.");
          conn.binaryType = "arraybuffer";
          conn.send(replayInfo.data);
        });

        await ws.execute(handleSocketMessage);
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
        ws.ws.send(payload);
      }

      break;
    }
    default: {
      console.log("Unhandled socket command: " + action.cmd);

      break;
    }
  }
}
