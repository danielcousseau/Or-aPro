import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-orcapro.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'OrçaPro - Gestão de Marcenaria',
        short_name: 'OrçaPro',
        description: 'Sistema profissional para gestão de orçamentos e clientes',
        theme_color: '#0056A3', // Cor da sua marca para a barra de cima do celular
        background_color: '#ffffff',
        display: 'standalone', // Essa é a mágica que esconde o navegador e faz parecer um App real!
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
})
