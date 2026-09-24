import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { seoPlugin } from "./seo.plugin"

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), seoPlugin(loadEnv(mode, process.cwd(), "VITE_"))],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Only the libraries every page needs get a stable, long-cached chunk.
        // Anything else is left to Rollup so it lands next to the lazy routes
        // that use it instead of being preloaded on the landing page.
        manualChunks(id: string) {
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return "vendor-react"
          return undefined
        },
      },
    },
  },
}))
