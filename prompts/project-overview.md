# Neos 项目介绍

## 项目简介

Neos 是一个 **Web 版游戏王对战平台**，目标是让玩家无需下载客户端，直接在浏览器中进行游戏王卡牌对战。

核心功能：
- 竞技匹配（MyCard 天梯）
- 娱乐匹配
- MC 观战列表
- 单人模式（AI 对战）
- 自定义房间
- 录像回放

兼容萌卡社区的 [srvpro](https://github.com/mycard/srvpro) 服务器，可与 ygopro 客户端联机。

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                      UI 模块                                │
│         React 18 + Ant Design + React Router                │
├─────────────────────────────────────────────────────────────┤
│                    Service 模块                             │
│              业务逻辑（决斗事件处理）                         │
├─────────────────────────────────────────────────────────────┤
│                  MiddleWare 模块                            │
│              WebSocket 长连接处理                            │
├─────────────────────────────────────────────────────────────┤
│                   Adapter 模块                              │
│         ygopro 协议 (二进制 ↔ TypeScript)                   │
├─────────────────────────────────────────────────────────────┤
│                     API 模块                                │
│              HTTP 请求（登录、卡片数据等）                    │
├─────────────────────────────────────────────────────────────┤
│                    Store 模块                               │
│              全局状态管理 (Valtio)                           │
└─────────────────────────────────────────────────────────────┘
```

技术栈：
- **前端框架**: React 18 + TypeScript
- **状态管理**: Valtio
- **路由**: React Router 6
- **UI 组件**: Ant Design 5
- **构建工具**: Vite
- **数据库**: sql.js (WebAssembly 版 SQLite，用于卡片数据)
- **协议**: Google Protobuf (与服务器通信)
- **动画**: React Spring

## 目录结构

```
src/
├── api/          # API 接口（HTTP 请求、卡片数据、mdproDeck 等）
├── config/       # 配置文件
├── container/    # 依赖注入容器
├── hook/         # React Hooks
├── infra/        # 基础设施（buffer、stream、eventbus 等）
├── middleware/   # 中间件（WebSocket、SQLite）
├── service/      # 业务逻辑
│   ├── duel/     # 决斗相关事件处理（抽卡、召唤、攻击、连锁等）
│   ├── room/     # 房间相关
│   └── ...
├── stores/       # 状态管理
├── styles/       # 全局样式
├── types/        # TypeScript 类型定义
└── ui/           # UI 组件
    ├── BuildDeck/    # 卡组构建
    ├── Duel/         # 决斗界面
    ├── Match/        # 匹配界面
    ├── Shared/       # 共享组件
    └── ...
```

## 部署

- https://neos.moecube.com (萌卡社区)
- https://www.neos.moe (Cloudflare)

## 相关链接

- [GitLab 仓库](https://code.mycard.moe/mycard/Neos)
- [项目文档](https://doc.neos.moe)
- [萌卡社区](https://mycard.moe/)
