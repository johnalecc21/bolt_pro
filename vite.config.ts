import path from "path"
import { execSync } from "child_process"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { seoPlugin } from "./seo.plugin"

// Version reported with every frontend error: the deploy's commit (Vercel sets
// VERCEL_GIT_COMMIT_SHA), else the local git commit, else nothing.
function versionApp(): string {
  if (process.env.VITE_APP_VERSION) return process.env.VITE_APP_VERSION
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim()
  } catch {
    return ""
  }
}
process.env.VITE_APP_VERSION = versionApp()

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
