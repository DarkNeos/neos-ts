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
    extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json", ".ydk"],
  },
});
