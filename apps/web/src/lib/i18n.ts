"use client"

import { useCallback, useEffect, useState } from "react"
import enCommon from "@/locales/en/common.json"
import enHome from "@/locales/en/home.json"
import enDiscover from "@/locales/en/discover.json"
import enHeritage from "@/locales/en/heritage.json"
import enTrips from "@/locales/en/trips.json"
import enEmergency from "@/locales/en/emergency.json"
import enHotel from "@/locales/en/hotel.json"
import enAccount from "@/locales/en/account.json"
import enAuth from "@/locales/en/auth.json"
import enAdmin from "@/locales/en/admin.json"
import enManager from "@/locales/en/manager.json"
import enStaff from "@/locales/en/staff.json"
import enTransportation from "@/locales/en/transportation.json"
import amCommon from "@/locales/am/common.json"
import amHome from "@/locales/am/home.json"
import amDiscover from "@/locales/am/discover.json"
import amHeritage from "@/locales/am/heritage.json"
import amTrips from "@/locales/am/trips.json"
import amEmergency from "@/locales/am/emergency.json"
import amHotel from "@/locales/am/hotel.json"
import amAccount from "@/locales/am/account.json"
import amAuth from "@/locales/am/auth.json"
import amAdmin from "@/locales/am/admin.json"
import amManager from "@/locales/am/manager.json"
import amStaff from "@/locales/am/staff.json"
import amTransportation from "@/locales/am/transportation.json"

export type Language = "en" | "am"
export type TranslationNamespace = "common" | "home" | "discover" | "heritage" | "trips" | "emergency" | "hotel" | "account" | "auth" | "admin" | "manager" | "staff" | "transportation"

export const translationNamespaces: readonly TranslationNamespace[] = [
  "common",
  "home",
  "discover",
  "heritage",
  "trips",
  "emergency",
  "hotel",
  "account",
  "auth",
  "admin",
  "manager",
  "staff",
  "transportation",
]

export type TranslationParams = Record<string, string | number>

type Dictionary = Record<TranslationNamespace, Record<string, string>>

const dictionaries: Record<Language, Dictionary> = {
  en: {
    common: enCommon,
    home: enHome,
    discover: enDiscover,
    heritage: enHeritage,
    trips: enTrips,
    emergency: enEmergency,
    hotel: enHotel,
    account: enAccount,
    auth: enAuth,
    admin: enAdmin,
    manager: enManager,
    staff: enStaff,
    transportation: enTransportation,
  },
  am: {
    common: amCommon,
    home: amHome,
    discover: amDiscover,
    heritage: amHeritage,
    trips: amTrips,
    emergency: amEmergency,
    hotel: amHotel,
    account: amAccount,
    auth: amAuth,
    admin: amAdmin,
    manager: amManager,
    staff: amStaff,
    transportation: amTransportation,
  },
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name)
      ? String(params[name])
      : match,
  )
}

function lookup(
  namespace: TranslationNamespace,
  key: string,
  language: Language,
): string | undefined {
  return dictionaries[language]?.[namespace]?.[key]
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("en")

  const applyLanguage = useCallback((next: Language) => {
    if (typeof document === "undefined") return
    document.documentElement.lang = next
    document.documentElement.dir = "ltr"
    localStorage.setItem("luxstay_lang", next)
    window.dispatchEvent(new CustomEvent("languagechange", { detail: next }))
  }, [])

  const setLanguage = useCallback(
    (next: Language) => {
      setLanguageState(next)
      applyLanguage(next)
    },
    [applyLanguage],
  )

  useEffect(() => {
    const stored = localStorage.getItem("luxstay_lang")
    const initial: Language = stored === "am" ? "am" : "en"
    setLanguageState(initial)
    applyLanguage(initial)
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<Language>).detail
      if (next === "en" || next === "am") setLanguageState(next)
    }
    window.addEventListener("languagechange", onChange)
    return () => window.removeEventListener("languagechange", onChange)
  }, [applyLanguage])

  const t = useCallback(
    (
      namespace: TranslationNamespace,
      key: string,
      params?: TranslationParams,
    ) => {
      const value =
        lookup(namespace, key, language) ?? lookup(namespace, key, "en")
      if (value === undefined) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[i18n] Missing key "${namespace}.${key}"`)
        }
        return key
      }
      return interpolate(value, params)
    },
    [language],
  )

  return { language, setLanguage, t }
}
