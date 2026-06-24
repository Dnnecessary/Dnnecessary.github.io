import { defineConfig } from "vite";
import { miaodaDevPlugin } from "miaoda-sc-plugin";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // miaodaDevPlugin 只在开发环境使用
    mode === 'development' ? miaodaDevPlugin() : null,
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // GitHub Pages (username.github.io) 使用根路径
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 确保资源使用相对路径，兼容子目录部署
    assetsInlineLimit: 4096,
  },
}));
