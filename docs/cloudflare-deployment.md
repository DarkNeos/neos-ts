# Cloudflare 部署

网页可通过 Cloudflare Workers Static Assets 部署到自有域名，例如
`neos.example.com`。

仓库提供 `wrangler.example.jsonc` 和 `wrangler.beta.example.jsonc` 两份配置模板。
实际部署使用本地的 `wrangler.jsonc` 和 `wrangler.beta.jsonc`，这两个文件已加入
`.gitignore`，真实域名只保存在本地配置中。

## 首次部署

部署工具要求 Node.js 22 或更高版本。

```bash
npm ci
cp -n wrangler.example.jsonc wrangler.jsonc
cp -n wrangler.beta.example.jsonc wrangler.beta.jsonc
```

复制命令不会覆盖已有本地配置。将本地配置中的 `name` 改为自己的 Worker 名称，
并将 `routes[].pattern` 改为自己管理的域名。模板中的 `neos.example.com` 和
`neos-beta.example.com` 仅供示例，部署前需要替换。

完成配置后，登录 Cloudflare 并部署：

```bash
npx wrangler login
npm run deploy
```

Cloudflare 账号需要拥有本地配置中对应域名的管理权限。Wrangler 会为配置的域名
创建 Worker 自定义域名及对应的 DNS 和证书配置。

## 后续更新

```bash
npm ci
npm run deploy
```

部署命令会先执行 `npm run build`，再上传 `dist`。生产构建读取
`neos.config.prod.json`，并包含 `neos-assets` 下的 WebAssembly、图片和音频。
不要使用 `build:prod`，该命令保留了原站的 CDN 路径。

测试站示例域名为 `neos-beta.example.com`，实际部署使用本地的
`wrangler.beta.jsonc`，通过 `npm run deploy:beta` 部署。
两个站点都使用当前工作区的同一套生产构建。

只部署浏览器网页及静态资源，不运行或上传 `agent/` 中的 AI Agent，
也不需要配置 LLM 凭据。登录、匹配、卡牌数据和对战继续使用生产配置中的外部服务。
新域名下的登录回调和外部服务跨域权限需要由对应服务支持。

SPA 回退已启用，直接访问或刷新 `/match/`、`/build`、`/duel` 等路径
会加载同一应用入口。

当前使用 Wrangler 手动部署；推送到 Git 远端不会自动发布。
