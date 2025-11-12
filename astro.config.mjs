// @ts-check
import { defineConfig } from 'astro/config';
import glsl from 'vite-plugin-glsl'
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // adapter: cloudflare({
  //   platformProxy: {
  //     enabled: true
  //   }
  // }),
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true
  },
  output: 'static',
  // ビルド設定
  build: {
    // 静的アセットの最適化
    assets: '_astro'
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
