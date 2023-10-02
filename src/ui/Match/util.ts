import rustInit from "rust-src";

import { initStrings } from "@/api";
import { useConfig } from "@/config";
import socketMiddleWare, { socketCmd } from "@/middleware/socket";
import sqliteMiddleWare, { sqliteCmd } from "@/middleware/sqlite";
import { User } from "@/stores";

const NeosConfig = useConfig();

// 连接SRVPRO服务
export const connectSrvpro = async (params: {
  ip: string;
  player: string;
  passWd: string;
  replay?: boolean;
  replayData?: ArrayBuffer;
}) => {
  // 初始化wasm
  const url =
    import.meta.env.BASE_URL === "/"
      ? undefined
      : new URL("rust_src_bg.wasm", `${import.meta.env.BASE_URL}assets/`);
  await rustInit(url);

  // 初始化sqlite
  await sqliteMiddleWare({
    cmd: sqliteCmd.INIT,
    initInfo: { dbUrl: NeosConfig.cardsDbUrl },
  });

  // 初始化I18N文案
  await initStrings();

  if (params.replay && params.replayData) {
    // 连接回放websocket服务
    socketMiddleWare({
      cmd: socketCmd.CONNECT,
      isReplay: true,
      replayInfo: {
        Url: NeosConfig.replayUrl,
        data: params.replayData,
      },
    });
  } else {
    // 通过socket中间件向ygopro服务端请求建立长连接
    socketMiddleWare({
      cmd: socketCmd.CONNECT,
      initInfo: params,
    });
  }
};

export function getEncryptedPasswd(roomID: string, user: User): string {
  const optionsBuffer = new Uint8Array(6);
  optionsBuffer[1] = 3 << 4;
  let checksum = 0;

  for (let i = 1; i < optionsBuffer.length; i++) {
    checksum -= optionsBuffer[i];
  }

  optionsBuffer[0] = checksum & 0xff;

  const secret = (user.external_id % 65535) + 1;

  for (let i = 0; i < optionsBuffer.length; i += 2) {
    const value = (optionsBuffer[i + 1] << 8) | optionsBuffer[i];
    const xorResult = value ^ secret;
    optionsBuffer[i + 1] = (xorResult >> 8) & 0xff;
    optionsBuffer[i] = xorResult & 0xff;
  }

  const base64String = btoa(String.fromCharCode(...optionsBuffer));

  return base64String + roomID;
}
