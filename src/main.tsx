/*
 * Neos是基于[React](https://reactjs.org/)框架
 * 研发的Web版[Ygopro](https://github.com/Fluorohydride/ygopro)，游戏王对战平台。
 *
 * - 路由管理：[React Router](https://reactrouter.com/en/main)
 * - 状态管理：[valtio](https://valtio.pmnd.rs/)
 *
 * 项目整体架构分为以下模块：
 * - UI模块：基于HTML+CSS进行UI渲染；
 * - Service模块：一些具体业务逻辑的实现，通常是一些事件处理函数；
 * - MiddleWare（中间件）模块：收敛Websocket长连接的处理逻辑；
 * - Adapter模块：进行ygopro数据协议从二进制buffer到TypeScript结构体之间的转换；
 * - Api模块：提供长连接以外请求网络数据的接口，比如登录萌卡账号；
 * - Store模块：进行全局状态的管理。
 *
 * */
import "u-reset.css";
import "overlayscrollbars/overlayscrollbars.css";
import "@/styles/core.scss";
import "@/styles/inject.scss";

import { ProConfigProvider } from "@ant-design/pro-provider";
import { App } from "antd";
import React from "react";
import ReactDOM from "react-dom/client";

import { NeosConfigProvider } from "@/ui/NeosConfigProvider";

import { I18NProvider } from "./ui/I18N";
import { NeosRouter } from "./ui/NeosRouter";

const browserDefaults = new AbortController();
const browserEventOptions = {
  capture: true,
  passive: false,
  signal: browserDefaults.signal,
};

// 只取消浏览器默认行为，继续传递游戏需要的右键和触摸事件。
for (const type of ["contextmenu", "gesturestart", "gesturechange"]) {
  window.addEventListener(
    type,
    (event) => event.preventDefault(),
    browserEventOptions,
  );
}

window.addEventListener(
  "wheel",
  (event) => {
    // Chromium 将触控板捏合转换为带 Ctrl 的滚轮事件，普通滚动保持可用。
    if (event.ctrlKey) event.preventDefault();
  },
  browserEventOptions,
);

import.meta.hot?.dispose(() => browserDefaults.abort());

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <I18NProvider>
    <NeosConfigProvider>
      <App>
        <ProConfigProvider dark>
          <NeosRouter />
        </ProConfigProvider>
      </App>
    </NeosConfigProvider>
  </I18NProvider>,
);
