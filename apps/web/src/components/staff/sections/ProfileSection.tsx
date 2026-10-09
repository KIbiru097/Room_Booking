"use client"

import {
  CheckCircle2,
  Globe2,
  LogOut,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react"
import {
  STAFF_CAPABILITIES,
  STAFF_RESTRICTED_CAPABILITIES,
} from "../permissions"
import { useStaffWorkspaceContext } from "../workspace-context"

export function ProfileSection() {
  const {
    t,
    user,
    hotels,
    selectedHotel,
    capabilities,
    language,
    setLanguage,
    isDark,
    toggleStaffTheme,
    handleLogout,
    openSection,
  } = useStaffWorkspaceContext()

  const granted = STAFF_CAPABILITIES.filter((capability) =>
    capabilities.has(capability),
  )
  const denied = STAFF_CAPABILITIES.filter(
    (capability) => !capabilities.has(capability),
  )

  const initials = (user?.fullName || user?.email || "S")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#182333] dark:text-white">
          {t("staff", "navProfile")}
        </h1>
        <p className="text-[#64748B] dark:text-slate-400 text-xs sm:text-sm mt-0.5">
          {t("staff", "profileSubtitle")}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] font-serif text-xl font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate font-serif text-lg font-bold text-[#182333] dark:text-white">
                {user?.fullName || t("staff", "profileUnknownName")}
              </p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#2563EB]/10 px-2 py-0.5 text-[10px] font-bold text-[#2563EB]">
                <UserRound className="h-3 w-3" />
                {user?.role || "STAFF"}
              </span>
            </div>
          </div>

          <dl className="mt-5 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-slate-500">
                {t("staff", "profileCurrentProperty")}
              </dt>
              <dd className="text-right font-bold text-[#182333] dark:text-white">
                {selectedHotel?.name || t("staff", "switcherNoHotel")}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-slate-500">
                {t("staff", "profileAssignedProperties")}
              </dt>
              <dd className="text-right font-bold text-[#182333] dark:text-white">
                {hotels.length}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-slate-500">
                {t("staff", "profileAccessSource")}
              </dt>
              <dd className="text-right font-bold text-[#182333] dark:text-white">
                {t("staff", "profileAccessServer")}
              </dd>
            </div>
          </dl>

          <div className="mt-5 rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
            {t("staff", "profileServerNote")}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("staff", "signOut")}
          </button>
        </section>

        <section className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#182333] dark:text-white">
              {t("staff", "profilePermissionsTitle")}
            </h2>
            <span className="ml-auto rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
              {t("staff", "profileGrantedCount", { count: granted.length })}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {t("staff", "profilePermissionsHint")}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {granted.map((capability) => (
              <span
                key={capability}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"
              >
                <CheckCircle2 className="h-3 w-3" />
                {capability}
              </span>
            ))}
          </div>

          <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Lock className="h-3 w-3" />
              {t("staff", "profileRestrictedTitle")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                ...new Set([
                  ...denied.map((capability) => capability),
                  ...STAFF_RESTRICTED_CAPABILITIES,
                ]),
              ].map((capability) => (
                <span
                  key={capability}
                  className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-500 line-through"
                >
                  {capability}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t("staff", "profilePreferences")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage(language === "en" ? "am" : "en")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Globe2 className="h-3.5 w-3.5" />
                  {language === "en"
                    ? t("staff", "langAm")
                    : t("staff", "langEn")}
                </button>
                <button
                  type="button"
                  onClick={toggleStaffTheme}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {isDark ? (
                    <Sun className="h-3.5 w-3.5" />
                  ) : (
                    <Moon className="h-3.5 w-3.5" />
                  )}
                  {isDark ? t("staff", "themeLight") : t("staff", "themeDark")}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t("staff", "profileQuickLinks")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openSection("shift")}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {t("staff", "navShift")}
                </button>
                <button
                  type="button"
                  onClick={() => openSection("notifications")}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {t("staff", "navNotifications")}
                </button>
                <button
                  type="button"
                  onClick={() => openSection("activity")}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {t("staff", "navActivity")}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
