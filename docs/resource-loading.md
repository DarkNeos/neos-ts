# 首次加载资源与 HTTP Range 下载

2026-09-30 使用全新 Chrome 会话加载当前生产构建。中文首页固定资源首次传输约 **10.8 MB**，包含 gzip 压缩后的程序和字体。下文使用十进制单位，1 MB = 1,000,000 字节。

## 资源清单

| 资源                                                             |           文件大小 | 首次传输量约值 | 加载时机           |
| ---------------------------------------------------------------- | -----------------: | -------------: | ------------------ |
| 正式卡库 `ygopro-database/zh-CN/cards.cdb`                       |     8,087,552 字节 |        8.09 MB | 应用初始化         |
| 先行卡库 `ygopro-super-pre/data/test-release.cdb`                |        69,632 字节 |        0.07 MB | 应用初始化         |
| SQLite `neos-assets/sql-wasm.wasm`                               |       613,426 字节 |        0.61 MB | 应用初始化         |
| 正式环境禁限表 `ygopro-database/zh-CN/lflist.conf`               |       676,679 字节 |        0.68 MB | 应用初始化         |
| 408 环境禁限表 `cn-database/env408-zh-CN/expansions/lflist.conf` |       138,931 字节 |        0.14 MB | 应用初始化         |
| 卡片文案 `ygopro-database/zh-CN/strings.conf`                    |        47,685 字节 |        0.05 MB | 应用初始化         |
| 先行配置 `ygopro-super-pre/data/test-release-v2.json`            |        88,512 字节 |  0.02 MB，gzip | 应用初始化         |
| 入口及首页 JavaScript、CSS                                       |         约 2.69 MB |  0.72 MB，gzip | 页面及首页模块加载 |
| 首页图片、背景纹理、Logo、favicon                                |         约 0.36 MB |        0.36 MB | 页面渲染           |
| 外部字体 CSS、Electrolize 字体、阿里图标脚本                     | 随字体服务响应变化 |        0.06 MB | 页面样式与图标加载 |

卡库和配置来自 `neos.config.prod.json` 中的公共 CDN，文件大小读取自公开资源响应头。真实 Range 请求和首次传输量通过本地 `vite preview` 的生产构建核实，未部署线上。传输量为浏览器网络统计近似值，不是浏览器内存占用。

首页图片包括 `neos-main.webp`、`neos-main-bg.webp`、`neos-logo.svg`、`noise-light.webp` 和 favicon。卡组编辑、匹配、决斗等页面的独立模块在进入对应页面时加载。部分卡组编辑代码仍包含在入口文件中。

首页还会请求公共卡组列表；登录状态下可能加载用户头像等资源，大小随返回数据变化，不计入固定资源合计。字体文件按实际使用的字形加载，进入其他页面时可能增加。

卡图通过 `getCardImgUrl` 按显示需要逐张加载。音乐和音效默认关闭；开启后按播放需要加载，并缓存到 IndexedDB。首次加载不会下载整个卡图库、全部卡盒图片或全部音频。预设卡组已经编入程序，初始化时从 IndexedDB 读取或保存。

## 5 MB 分段下载

`src/middleware/sqlite/index.ts` 为两份卡库启用 `pfetch` 的 `chunkSize: 5_000_000`。其他初始化配置、WebAssembly、程序和图片保持现有请求方式。

实测正式卡库发出两个请求：

```http
Range: bytes=0-4999999
Range: bytes=5000000-8087551
```

两次响应均为 `206 Partial Content`。先行卡库小于 5 MB，只需一次请求，服务器返回整个 69,632 字节文件对应的部分内容响应。

实现会顺序下载各段，失败时最多重试当前段两次。每次请求独立计算 30 秒超时，超时包含响应体读取。完成前校验分段位置、长度、总长度、ETag 和 Last-Modified，随后按字节顺序拼成完整响应，交给 sql.js 初始化。

服务器忽略 Range 并返回 `200 OK` 时，直接使用该完整响应。如果浏览器不能读取 Content-Range，或响应声明使用压缩表示，则重新完整下载。HTTP 允许服务器忽略 Range，详见 [RFC 9110 第 14 节](https://www.rfc-editor.org/rfc/rfc9110.html#name-range-requests)。当前 CDN 已开放 Range 请求和 Content-Range 等响应头，真实 Chrome 请求已验证可用。

分段不会降低总下载量。sql.js 仍需拿到完整卡库才能初始化。本次不保存未完成分段，刷新页面后重新下载，是否命中 HTTP 缓存由浏览器和 CDN 决定。

## 验证

```bash
npx tsc --noEmit
npx eslint src/infra/pfetch.ts src/middleware/sqlite/index.ts
npm run build
npx playwright test tests/e2e/resource-download.spec.ts --workers=1
```

9 项下载测试覆盖真实 5 MB 分段边界、拼接后的 SHA-256、服务器忽略 Range、缺失 Content-Range、当前段重试、错误偏移、截断内容、文件版本变化、响应体超时、取消和首页卡库初始化。现有自定义服务器的 2 项兼容性测试也已通过。
