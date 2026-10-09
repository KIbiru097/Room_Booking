"use client"

import { Gauge, WifiOff } from "lucide-react"
import { useLanguage } from "@/lib/i18n"
import { hasCachedData } from "@/lib/offline-cache"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"

export default function OfflineStatusBanner() {
  const { t } = useLanguage()
  const { isOnline, isDegraded } = useNetworkStatus()
  const cached = hasCachedData()
  if (isOnline && !isDegraded) return null

  const offline = !isOnline
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-[4.5rem] z-40 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-center text-xs font-semibold text-amber-950 shadow-sm dark:border-amber-800 dark:bg-amber-950/95 dark:text-amber-100"
    >
      <span className="inline-flex items-center gap-2">
        <span aria-hidden="true">
          {offline ? (
            <WifiOff className="h-4 w-4" />
          ) : (
            <Gauge className="h-4 w-4" />
          )}
        </span>
        {offline
          ? t("common", "offlineNotice")
          : t("common", "slowConnectionNotice")}
        {cached && (
          <span className="font-normal">
            {t("common", "cachedDataAvailable")}
          </span>
        )}
      </span>
    </div>
  )
}
