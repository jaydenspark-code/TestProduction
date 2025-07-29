import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024 // 4 MB limit
        },
        manifest: {
          name: 'EarnPro - Referral Rewards Platform',
          short_name: 'EarnPro',
          description: 'The world\'s most trusted referral rewards platform',
          theme_color: '#8B5CF6',
          background_color: '#1F2937',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            }
          ]
        },
        devOptions: {
          enabled: false // Disable PWA in development to avoid manifest conflicts
        }
      }),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(/%VITE_PAYPAL_CLIENT_ID%/g, env.VITE_PAYPAL_CLIENT_ID || '');
        }
      }
    ],
    assetsInclude: ['**/*.svg'],
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@config': '/src/config',
        '@context': '/src/context',
        '@utils': '/src/utils'
      }
    },
    optimizeDeps: {
      exclude: ['lucide-react']
    },
    server: {
      port: 5173,
      strictPort: false,
      host: true,
      open: false
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            utils: ['lodash']
          }
        }
      }
    }
  };
});
