import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Hitster",
        short_name: "Hitster",
        start_url: ".",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#1db954",
        description: "Your music game as a PWA!",
        icons: [
          {
            src: "app-icon.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
        ],
      },
    }),
  ],
  base: "/hitster/",
  resolve: {
    alias: {
      "@/components": "/home/lucas/git/hitster/src/components",
    },
  },
})
