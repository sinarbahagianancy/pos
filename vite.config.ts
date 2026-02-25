import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';

  const basePlugins = [
    react(), 
    tailwindcss(), 
    tsconfigPaths(),
  ];

  if (isDev) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const vitePluginApiServer = require('./src/server/api-dev.js');
    
    basePlugins.push(vitePluginApiServer.default());
  }

  return {
    plugins: basePlugins,
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    build: {
      rollupOptions: {
        external: ['postgres', 'drizzle-orm/postgres-js']
      }
    },
    define: {
      'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL)
    }
  };
});
