import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import ydkLoader from "vite-ydk-loader";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: false,
  },
  plugins: [
    react(),
    svgr(),
    ydkLoader(),
    tsconfigPaths(),
  ],
  resolve: {
    extensions: [".js", ".json", ".ydk"],
  },
});
