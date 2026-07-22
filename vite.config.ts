import { defineConfig, loadEnv } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDev = mode === "development";

  const basePlugins = [react(), tailwindcss(), tsconfigPaths()];

  if (isDev) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const vitePluginApiServer = require("./src/server/api-dev.js");

    basePlugins.push(vitePluginApiServer.default());
  }

  return {
    staged: {
      "*": "vp check --fix",
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
    // Vitest (vp test) only runs unit tests. The Playwright e2e specs in
    // tests/e2e/*.spec.ts are executed by `npx playwright test` via their own
    // playwright.config.ts and must NOT be picked up by the unit runner
    // (running them here throws "Playwright Test did not expect test.describe()").
    test: {
      include: ["tests/**/*.test.ts"],
    },
  };
});
