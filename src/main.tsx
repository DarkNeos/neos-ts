/*
 * Neos是基于[React](https://reactjs.org/)和[Babylon.js](https://www.babylonjs.com/)框架
 * 研发的Web版[Ygopro](https://github.com/Fluorohydride/ygopro)，游戏王对战平台。
 *
 * - 路由管理：[React Router](https://reactrouter.com/en/main)
 * - 状态管理：[Redux](https://redux.js.org/)
 * - 3D渲染：[Babylon.js](https://www.babylonjs.com/)
 *
 * 项目整体架构分为以下模块：
 * - UI模块：使用React组件和Babylon.js提供的渲染能力进行UI展示；
 * - Service模块：一些具体业务逻辑的实现，通常是一些事件处理函数；
 * - MiddleWare（中间件）模块：收敛Websocket长连接的处理逻辑；
 * - Adapter模块：进行ygopro数据协议从二进制buffer到TypeScript结构体之间的转换；
 * - Api模块：提供长连接以外请求网络数据的接口，比如获取卡组数据；
 * - Reducer模块：进行全局的状态更新；
 * - Store模块：存储全局状态。
 *
 * 在设计上各个模块之间都是解耦的，模块之间的依赖应该通过调用接口，而非调用实例。
 * 在进行代码开发的时候需要注意这点。
 *
 * */
import { ProConfigProvider } from "@ant-design/pro-provider";
import { ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import Neos from "./ui/Neos";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <BrowserRouter>
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }} locale={zhCN}>
      <ProConfigProvider dark>
        <Neos />
      </ProConfigProvider>
    </ConfigProvider>
  </BrowserRouter>
);
