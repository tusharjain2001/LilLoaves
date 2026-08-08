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
        // Dev only. In production this path is the serverless function in
        // api/store.js. The dev server has no serverless runtime, so forward
        // straight to WordPress, translating ?endpoint= into a path segment.
        '/api/store': {
          target: env.WP_STORE_URL,
          changeOrigin: true,
          rewrite: (p) => {
            const [, query = ''] = p.split('?')
            const params = new URLSearchParams(query)
            const endpoint = params.get('endpoint') ?? ''
            params.delete('endpoint')
            const rest = params.toString()
            return `/wp-json/wc/store/v1/${endpoint}${rest ? `?${rest}` : ''}`
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
    },
  }
})
