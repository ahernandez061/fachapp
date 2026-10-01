/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages sirve la app en https://<usuario>.github.io/fachapp/
// En builds nativas (Capacitor, --mode native) los recursos van con rutas relativas.
export default defineConfig(({ mode }) => {
  const base = mode === 'native' ? './' : '/fachapp/'
  return {
    base,
    // Puerto propio para no chocar con otros proyectos Vite (5173).
    server: { port: 5180, strictPort: true },
    preview: { port: 4180, strictPort: true },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'FachApp',
          short_name: 'FachApp',
          description: 'Completa misiones, compártelas y sube en el ranking.',
          lang: 'es-ES',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#fafaf9',
          theme_color: '#c2410c',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'icons/maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            { src: 'logo.svg', sizes: 'any', type: 'image/svg+xml' },
          ],
          categories: ['social', 'lifestyle'],
        },
        workbox: {
          // HashRouter: la navegación siempre sirve index.html.
          navigateFallback: 'index.html',
          globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        },
      }),
    ],
    resolve: {
      alias: {
        '@shared': path.resolve(import.meta.dirname, '../../supabase/functions/_shared'),
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      include: ['src/**/*.test.{ts,tsx}', '../../supabase/functions/_shared/**/*.test.ts'],
    },
  }
})
