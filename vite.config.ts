import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    // 构建时预压缩 .gz / .br，交由静态托管（Nginx gzip_static、CDN 等）直接下发
    compression({ algorithm: 'gzip', ext: '.gz', threshold: 10240 }),
    compression({ algorithm: 'brotliCompress', ext: '.br', threshold: 10240 }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
  },
});
