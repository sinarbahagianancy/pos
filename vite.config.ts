import { defineConfig, loadEnv } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDev = mode === "development";

  const basePlugins = [
    react(),
    tailwindcss(),
    // Native tsconfig paths resolution (no plugin needed!)
  ];

  if (isDev) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const vitePluginApiServer = require("./src/server/api-dev.js");

    basePlugins.push(vitePluginApiServer.default());
  }

  return {
    resolve: {
      // Native TypeScript path resolution
      tsconfigPaths: true,
    },
    plugins: basePlugins,
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    build: {
      rollupOptions: {
        external: ["postgres", "drizzle-orm/postgres-js", "playwright"],
      },
    },
    define: {
      "process.env.DATABASE_URL": JSON.stringify(env.DATABASE_URL),
    },
  };
});
