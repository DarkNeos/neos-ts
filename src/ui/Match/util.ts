import rustInit from "rust-src";

import { initStrings, initSuperPrerelease } from "@/api";
import { useConfig } from "@/config";
import { getUIContainer, initUIContainer } from "@/container/compat";
import { WebSocketStream } from "@/infra";
import { initReplaySocket, initSocket } from "@/middleware/socket";
import {
  pollSocketLooper,
  pollSocketLooperWithAgent,
} from "@/service/executor";

import { initSqlite } from "../Layout/utils";

const NeosConfig = useConfig();

// 连接SRVPRO服务
export const connectSrvpro = async (params: {
  ip: string;
  player: string;
  passWd: string;
  enableKuriboh?: boolean;
  replay?: boolean;
  replayData?: ArrayBuffer;
  customOnConnected?: (conn: WebSocketStream) => void;
}) => {
  // 初始化wasm
  const url =
    import.meta.env.BASE_URL === "/"
      ? undefined
      : new URL("rust_src_bg.wasm", `${import.meta.env.BASE_URL}assets/`);
  await rustInit(url);

  // 初始化sqlite
  await initSqlite();

  // 初始化I18N文案
  await initStrings();

  // 初始化超先行配置
  await initSuperPrerelease();

  if (params.replay && params.replayData) {
    // connect to replay Server
    const conn = initReplaySocket({
      url: NeosConfig.replayUrl,
      data: params.replayData,
    });

    // initialize the UI Container
    initUIContainer(conn);

    // execute the event looper
    pollSocketLooper(getUIContainer());
  } else {
    // connect to the ygopro Server
    const conn = initSocket(params);

    // initialize the UI Contaner
    initUIContainer(conn);

    // execute the event looper

    if (params.enableKuriboh) {
      const container = getUIContainer();
      container.setEnableKuriboh(true);
      pollSocketLooperWithAgent(container);
    } else {
      pollSocketLooper(getUIContainer());
    }
  }
};
