// @ts-check
import { defineConfig } from 'astro/config';
import glsl from 'vite-plugin-glsl';

// https://astro.build/config
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true
  },
  // 開発時の設定
  vite: {
    plugins: [glsl()],
    // 開発サーバーでのAPI呼び出し最適化
    server: {
      cors: true
    }
  }
});
