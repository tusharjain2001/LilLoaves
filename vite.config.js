import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // In production this path is served by api/store/[...path].js on Vercel.
        // The dev server has no serverless runtime, so forward straight to
        // WordPress. Run `vercel dev` instead if you need the real cache.
        '/api/store': {
          target: env.WP_STORE_URL,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/store/, '/wp-json/wc/store/v1'),
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
    },
  }
})
