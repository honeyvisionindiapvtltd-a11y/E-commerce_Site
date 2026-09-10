import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const viteApiUrl = env.VITE_API_URL || "http://localhost:5000/api";
  const proxyTarget = /^https?:\/\//.test(viteApiUrl)
    ? viteApiUrl.replace(/\/api\/?$/, "")
    : "http://localhost:5003";

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/socket.io': {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});