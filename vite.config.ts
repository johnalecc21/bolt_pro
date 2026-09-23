import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Route-level code-splitting keeps each page small, but everything
        // these pages import in common was landing in one shared entry chunk —
        // paid even by the landing page or login, which use almost none of it.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined
          if (/node_modules\/(react|react-dom|react-router-dom)\//.test(id)) return "vendor-react"
          if (/node_modules\/(radix-ui|cmdk)\//.test(id)) return "vendor-radix"
          if (/node_modules\/recharts\//.test(id)) return "vendor-charts"
          if (/node_modules\/(framer-motion|gsap)\//.test(id)) return "vendor-motion"
          if (/node_modules\/(socket\.io-client|@sentry|@supabase\/supabase-js)\//.test(id)) return "vendor-misc"
          return undefined
        },
      },
    },
  },
})
