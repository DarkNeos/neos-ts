import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import ydkLoader from "vite-ydk-loader";
import tsconfigPaths from "vite-tsconfig-paths";
import sassDts from "vite-plugin-sass-dts";
import path from "path";
import arraybuffer from "vite-plugin-arraybuffer";

// https://vitejs.dev/config/
export default defineConfig({
  // 开发服务器和构建使用同一份子模块资源，保持场地图 URL 与现有部署兼容。
  publicDir: path.resolve(__dirname, "./neos-filed/artwork/public"),
  worker: { format: "es" },
  // Worker 按需加载内核，提前预打包可避免首次播放时触发整页刷新。
  optimizeDeps: { include: ["koishipro-core.js"] },
  plugins: [
    react(),
    svgr(),
    ydkLoader(),
    arraybuffer(),
    tsconfigPaths(),
    sassDts({
      enabledMode: ["development"],
      sourceDir: path.resolve(__dirname, "./src"),
    }),
  ],
  resolve: {
    alias: {
      // 预打包会改变内核模块的位置，显式打包其配套 WASM 并提供加载地址。
      "koishipro-core-assets": path.resolve(
        __dirname,
        "node_modules/koishipro-core.js/dist/vendor/wasm_esm",
      ),
    },
    extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json", ".ydk"],
  },
});
