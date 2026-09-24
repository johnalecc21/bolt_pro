import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { AuthProvider } from "@/lib/auth/AuthContext"
import { Toaster } from "@/components/ui/sonner"
import { AppErrorBoundary } from "@/components/shared/ErrorBoundary"
import { initMonitoring } from "@/lib/monitoring"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <App />
          <Toaster position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  </StrictMode>
)

// Monitoring loads once the browser is idle so it never competes with the first
// paint; an error caught before that starts it on demand (see reportError).
if ("requestIdleCallback" in window) window.requestIdleCallback(initMonitoring)
else setTimeout(initMonitoring, 1500)
