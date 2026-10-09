"use client"

import { useEffect, useState } from "react"

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isDegraded, setIsDegraded] = useState(false)

  useEffect(() => {
    const update = () => {
      setIsOnline(navigator.onLine)
      const connection = (navigator as Navigator & {
        connection?: { effectiveType?: string }
      }).connection
      setIsDegraded(
        navigator.onLine &&
          (connection?.effectiveType === "slow-2g" ||
            connection?.effectiveType === "2g"),
      )
    }
    update()
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    const connection = (navigator as Navigator & { connection?: EventTarget })
      .connection
    connection?.addEventListener("change", update)
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
      connection?.removeEventListener("change", update)
    }
  }, [])

  return { isOnline, isDegraded }
}
