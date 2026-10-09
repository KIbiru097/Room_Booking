"use client"

import { useEffect, useRef, useState } from "react"
import {
  Bell,
  Building2,
  Globe2,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Sun,
  UserCircle2,
  X,
} from "lucide-react"
import { STAFF_NAV } from "./nav"
import { StaffSidebar } from "./StaffSidebar"
import { HotelSwitcher } from "./HotelSwitcher"
import { useStaffWorkspaceContext } from "./workspace-context"

export function StaffTopbar() {
  const ws = useStaffWorkspaceContext()
  const {
    t,
    tab,
    notificationsOpen,
    setNotificationsOpen,
    unreadNotifications,
    setMobileNavOpen,
    refresh,
    setWalkInModalOpen,
    globalSearch,
    setGlobalSearch,
    searchResults,
    openSection,
    setBookingSearchQuery,
    setRoomSearchQuery,
    language,
    setLanguage,
    isDark,
    toggleStaffTheme,
    profileOpen,
    setProfileOpen,
    user,
    logout,
  } = ws
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const sectionMeta = STAFF_NAV.find((item) => item.id === tab)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
        window.setTimeout(() => searchInputRef.current?.focus(), 0)
      }
      if (event.key === "Escape") {
        setSearchOpen(false)
        setProfileOpen(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [setProfileOpen])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        !searchRef.current?.contains(target) &&
        !mobileSearchRef.current?.contains(target)
      )
        setSearchOpen(false)
      if (!profileRef.current?.contains(target)) setProfileOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [setProfileOpen])

  const selectSearchResult = (result: (typeof searchResults)[number]) => {
    if (result.kind === "booking") {
      setBookingSearchQuery(result.label)
      openSection("reservations")
    } else {
      setRoomSearchQuery(result.label)
      openSection("rooms")
    }
    setGlobalSearch("")
    setSearchOpen(false)
  }

  return (
    <header className="relative sticky top-0 z-40 border-b border-[#e4e0d7] dark:border-[#393a35] bg-[#fbfaf7]/88 dark:bg-[#222320]/88 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label={t("staff", "openMenu")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#e4e0d7] dark:border-[#393a35] text-[#77746b] dark:text-[#aaa79e] lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <h1
            className="truncate text-sm font-semibold text-[#24231f] dark:text-[#f0eee7] sm:text-base"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            {sectionMeta
              ? t("staff", sectionMeta.labelKey)
              : t("staff", "navOverview")}
          </h1>
          <p className="hidden truncate text-[11px] text-[#77746b] dark:text-[#aaa79e] sm:block">
            {t("staff", "topbarTagline")}
          </p>
        </div>

        <HotelSwitcher compact variant="topbar" />

        <div ref={searchRef} className="relative hidden md:block md:w-52 lg:w-64 xl:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#99958b]" />
          <input
            ref={searchInputRef}
            value={globalSearch}
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => {
              setGlobalSearch(event.target.value)
              setSearchOpen(true)
            }}
            aria-label={t("staff", "globalSearchLabel")}
            placeholder={t("staff", "globalSearchPlaceholder")}
            className="h-9 w-full rounded-xl border border-[#e4e0d7] bg-[#fbfaf7] pl-9 pr-8 text-[11px] text-[#24231f] outline-none transition-colors placeholder:text-[#aaa79e] focus:border-[#b69864]/70 dark:border-[#393a35] dark:bg-[#282926] dark:text-[#f0eee7]"
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => setGlobalSearch("")}
              aria-label={t("staff", "clearSearch")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#99958b] hover:bg-[#f0eee8] dark:hover:bg-[#30312d]"
            >
              <X className="h-3 w-3" />
            </button>
          )}

          {searchOpen && globalSearch.trim() && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-[#e4e0d7] bg-[#fbfaf7] p-1.5 shadow-xl dark:border-[#41473e] dark:bg-[#252925]">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={`${result.kind}-${result.id}`}
                    type="button"
                    onClick={() => selectSearchResult(result)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[#f0eee8] dark:hover:bg-white/5"
                  >
                    {result.kind === "booking" ? (
                      <UserCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#497363]" />
                    ) : (
                      <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a47c3b]" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold text-[#24231f] dark:text-[#f0eee7]">
                        {result.label}
                      </span>
                      <span className="block truncate text-[10px] text-[#77746b] dark:text-[#aaa79e]">
                        {result.detail}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-2.5 py-3 text-[11px] text-[#77746b] dark:text-[#aaa79e]">
                  {t("staff", "noSearchResults")}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label={t("staff", "globalSearchLabel")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#77746b] hover:bg-[#f0eee8] dark:hover:bg-[#30312d] md:hidden"
        >
          <Search className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLanguage(language === "en" ? "am" : "en")}
            aria-label={t("staff", "languageToggleLabel")}
            className="hidden h-9 items-center gap-1 rounded-xl px-2 text-[10px] font-bold text-[#77746b] transition-colors hover:bg-[#f0eee8] dark:text-[#aaa79e] dark:hover:bg-[#30312d] sm:inline-flex"
          >
            <Globe2 className="h-3.5 w-3.5" />
            {language === "en" ? "አማ" : "EN"}
          </button>

          <button
            type="button"
            onClick={toggleStaffTheme}
            aria-label={isDark ? t("staff", "themeLight") : t("staff", "themeDark")}
            className="hidden h-9 w-9 items-center justify-center rounded-xl text-[#77746b] transition-colors hover:bg-[#f0eee8] dark:text-[#aaa79e] dark:hover:bg-[#30312d] sm:inline-flex"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => setWalkInModalOpen(true)}
            className="sf-btn-primary !py-2 !px-3 !text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {t("staff", "btnWalkInGuest")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void refresh()}
            aria-label={t("staff", "btnRefresh")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#77746b] hover:bg-[#f0eee8] dark:hover:bg-[#30312d] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label={t("staff", "notificationsLabel")}
            aria-expanded={notificationsOpen}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#77746b] hover:bg-[#f0eee8] dark:hover:bg-[#30312d] transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -right-0.5 -top-0.5 min-w-[16px] rounded-full bg-[#a74b45] px-1 text-center text-[9px] font-bold leading-4 text-white">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>

          <div ref={profileRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label={t("staff", "profileMenuLabel")}
              aria-expanded={profileOpen}
              className="inline-flex max-w-[150px] items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-[#f0eee8] dark:hover:bg-[#30312d]"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#497363] to-[#2d332d] text-[11px] font-bold text-white">
                {(user?.fullName || user?.email || "S").charAt(0).toUpperCase()}
              </span>
              <span className="hidden min-w-0 lg:block">
                <span className="block truncate text-[10px] font-bold text-[#24231f] dark:text-[#f0eee7]">
                  {user?.fullName || t("staff", "staffProfileFallback")}
                </span>
                <span className="block truncate text-[9px] text-[#77746b] dark:text-[#aaa79e]">
                  {user?.role || "STAFF"}
                </span>
              </span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[#e4e0d7] bg-[#fbfaf7] p-1.5 shadow-xl dark:border-[#41473e] dark:bg-[#252925]">
                <div className="border-b border-[#e4e0d7] px-3 py-2.5 dark:border-[#41473e]">
                  <p className="truncate text-[11px] font-bold text-[#24231f] dark:text-[#f8f4eb]">
                    {user?.fullName || t("staff", "staffProfileFallback")}
                  </p>
                  <p className="truncate text-[10px] text-[#77746b] dark:text-[#979c92]">
                    {user?.email || "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    openSection("profile")
                    setProfileOpen(false)
                  }}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold text-[#24231f] hover:bg-[#f0eee8] dark:text-[#f0eee7] dark:hover:bg-white/5"
                >
                  {t("staff", "navProfile")}
                </button>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold text-[#a74b45] hover:bg-[#a74b45]/10"
                >
                  {t("staff", "signOut")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {searchOpen && (
        <div
          ref={mobileSearchRef}
          className="absolute left-3 right-3 top-full z-50 mt-2 rounded-xl border border-[#e4e0d7] bg-[#fbfaf7] p-2 shadow-xl dark:border-[#41473e] dark:bg-[#252925] md:hidden"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#99958b]" />
            <input
              autoFocus
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              aria-label={t("staff", "globalSearchLabel")}
              placeholder={t("staff", "globalSearchPlaceholder")}
              className="h-10 w-full rounded-lg border border-[#e4e0d7] bg-white pl-9 pr-3 text-xs text-[#24231f] outline-none placeholder:text-[#aaa79e] dark:border-[#393a35] dark:bg-[#282926] dark:text-[#f0eee7]"
            />
          </div>
          {globalSearch.trim() && (
            <div className="mt-1.5">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={`mobile-${result.kind}-${result.id}`}
                    type="button"
                    onClick={() => selectSearchResult(result)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-[#f0eee8] dark:hover:bg-white/5"
                  >
                    {result.kind === "booking" ? (
                      <UserCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#497363]" />
                    ) : (
                      <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a47c3b]" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold text-[#24231f] dark:text-[#f0eee7]">
                        {result.label}
                      </span>
                      <span className="block truncate text-[10px] text-[#77746b] dark:text-[#aaa79e]">
                        {result.detail}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-2.5 py-2 text-[11px] text-[#77746b] dark:text-[#aaa79e]">
                  {t("staff", "noSearchResults")}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  )
}

export function MobileNavDrawer() {
  const { mobileNavOpen, setMobileNavOpen, t } = useStaffWorkspaceContext()
  if (!mobileNavOpen) return null

  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <button
        type="button"
        aria-label={t("staff", "btnClose")}
        onClick={() => setMobileNavOpen(false)}
        className="absolute inset-0 bg-[#191a18]/52"
      />
      <div className="relative flex h-full w-72 flex-col shadow-2xl">
        <button
          type="button"
          onClick={() => setMobileNavOpen(false)}
          aria-label={t("staff", "btnClose")}
          className="absolute right-3 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#979c92] hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex-1 overflow-hidden">
          <StaffSidebar onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </div>
    </div>
  )
}
