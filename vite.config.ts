import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react-swc';
import { cloudflare } from '@cloudflare/vite-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: 'src/app/routes',
    }),
    react(),
    tailwindcss(),
    cloudflare({
      configPath: './wrangler.jsonc',
      // D1/R2 marked "remote" in wrangler.jsonc hit the real dev-db and
      // dev-files-bucket. LOCAL_BINDINGS=1 (npm run dev:local) keeps
      // everything in local Miniflare storage instead.
      remoteBindings: process.env.LOCAL_BINDINGS !== '1',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
