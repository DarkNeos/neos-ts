import { appendFileSync, readFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

const client = readFileSync(new URL("./animation-debug-client.js", import.meta.url), "utf8");
const logPath = `/tmp/neos-animation-debug-${Date.now()}.jsonl`;
const endpoint = "/__animation-debug";

const server = await createServer({
  root: fileURLToPath(new URL("../", import.meta.url)),
  server: { host: "0.0.0.0", port: 5173, strictPort: true },
  plugins: [{
    name: "neos-animation-debug",
    apply: "serve",
    transformIndexHtml() {
      return [{ tag: "script", attrs: { src: `${endpoint}/client.js` }, injectTo: "head" }];
    },
    configureServer(vite) {
      vite.middlewares.use((req, res, next) => {
        const path = req.url?.split("?")[0];
        if (path === `${endpoint}/client.js` && req.method === "GET") {
          res.setHeader("Content-Type", "application/javascript; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.end(client);
          return;
        }
        if (path !== `${endpoint}/log` || req.method !== "POST") return next();
        let body = "";
        req.setEncoding("utf8");
        req.on("data", chunk => {
          body += chunk;
          if (body.length > 256_000) req.destroy();
        });
        req.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (!Array.isArray(data.records) || data.records.length > 100) {
              res.statusCode = 400;
              res.end();
              return;
            }
            const receivedAt = new Date().toISOString();
            appendFileSync(logPath, data.records.map(record => JSON.stringify({
              receivedAt, clientAddress: req.socket.remoteAddress, session: data.session, ...record,
            })).join("\n") + "\n");
            for (const record of data.records) {
              if (record.type === "snapshot") continue;
              console.log(`[animation-debug ${data.session}] ${record.type}`, JSON.stringify(record.data));
            }
            res.statusCode = 204;
            res.end();
          } catch (error) {
            console.error("[animation-debug] 日志写入失败", error.message);
            res.statusCode = 400;
            res.end();
          }
        });
      });
    },
  }],
});

await server.listen();
server.printUrls();
console.log(`\n动画日志：${logPath}`);
for (const addresses of Object.values(networkInterfaces())) {
  for (const address of addresses ?? []) {
    if (address.family === "IPv4" && !address.internal) {
      console.log(`Windows 调试地址：http://${address.address}:5173/?animationDebug=1`);
    }
  }
}
