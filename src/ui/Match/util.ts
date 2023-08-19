import rustInit from "rust-src";

import { initStrings } from "@/api";
import { useConfig } from "@/config";
import socketMiddleWare, { socketCmd } from "@/middleware/socket";
import sqliteMiddleWare, { sqliteCmd } from "@/middleware/sqlite";

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
