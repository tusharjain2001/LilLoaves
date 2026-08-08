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
        // Dev only. In production this path is the serverless function in
        // api/store.js. The dev server has no serverless runtime, so forward
        // straight to WordPress, standing in for what that function does:
        // translate ?endpoint= into a path segment, pick the right REST
        // namespace, and attach the shared secret that /quote requires.
        //
        // Run `vercel dev` instead if you need to exercise the real function,
        // including its edge caching.
        '/api/store': {
          target: env.WP_STORE_URL,
          changeOrigin: true,
          rewrite: (p) => {
            const [, query = ''] = p.split('?')
            const params = new URLSearchParams(query)
            const endpoint = params.get('endpoint') ?? ''
            params.delete('endpoint')
            const rest = params.toString()
            // /quote lives on the bridge plugin's own namespace, not the
            // WooCommerce Store API, and takes no query string.
            if (endpoint === 'quote') return '/wp-json/lilloaves/v1/quote'
            return `/wp-json/wc/store/v1/${endpoint}${rest ? `?${rest}` : ''}`
          },
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // The bridge plugin rejects /quote without this, fail closed.
              // Server-side only: it never enters the browser bundle because
              // it is read here, in the dev server's own process.
              if (proxyReq.path.includes('/lilloaves/v1/quote') && env.LL_BRIDGE_SECRET) {
                proxyReq.setHeader('X-LL-Secret', env.LL_BRIDGE_SECRET)
              }
            })
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
