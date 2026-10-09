"use client"
// useState initialiser runs once — prevents creating a new client on every render.
// Proactive refresh every 14 minutes

import * as React from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { useAuth } from "@/lib/auth-store"
import { ToastContainer } from "@/components/ui/Toast"
import { ThemeProvider } from "@/providers/ThemeProvider"
import OfflineStatusBanner from "@/components/OfflineStatusBanner"

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => getQueryClient())
  const loadFromStorage = useAuth((s) => s.loadFromStorage)
  const refreshAuth = useAuth((s) => s.refreshAuth)

  React.useEffect(() => {
    loadFromStorage()
    const timer = window.setInterval(() => void refreshAuth(), 14 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [loadFromStorage, refreshAuth])

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <OfflineStatusBanner />
        <ToastContainer />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
