"use client"

/** Register the worker only in production so local development never gets stale assets. */
// PWA support is an enhancement; the web app remains fully usable if it is unavailable.

import { useEffect } from "react"
export default function PwaRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !==
        "production" ||
      !(
        "serviceWorker" in
        navigator
      )
    )
      return

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {})
  }, [])

  return null
}
