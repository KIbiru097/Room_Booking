"use client" /* Brand */ /* Navigation */ /* Footer block */

import { useEffect, useState } from "react"
import {
  HelpCircle,
  LifeBuoy,
  LogOut,
  UserCircle2,
  Wifi,
  WifiOff,
  X,
  ChevronRight,
} from "lucide-react"
import { NAV_GROUPS, STAFF_NAV } from "./nav"
import { useStaffWorkspaceContext } from "./workspace-context"
import { HotelSwitcher } from "./HotelSwitcher"

const LEVEL_STYLES: Record<string, string> = {
  urgent: "bg-[#a74b45] text-white",
  attention: "bg-[#b66c36] text-white",
  reminder: "bg-[#a77c27] text-white",
  info: "bg-[#497363] text-white",
}

export function StaffSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const ws = useStaffWorkspaceContext()
  const {
    t,
    tab,
    openSection,
    capabilities,
    ops,
    unreadNotifications,
    contactThreads,
    stayRequests,
    user,
    shift,
  } = ws
  const [online, setOnline] = useState(true)
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine)
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    return () => {
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
    }
  }, [])

  const badges: Record<string, number> = {
    tasks: ops.metrics.openTasks,
    requests: stayRequests.filter((request) => request.status === "PENDING")
      .length,
    inbox: contactThreads.filter((thread) => thread.status !== "CLOSED").length,
    maintenance: ops.metrics.maintenanceRooms,
    notifications: unreadNotifications,
  }

  const visible = STAFF_NAV.filter(
    (item) => !item.capability || capabilities.has(item.capability),
  )

  const navigate = (id: typeof STAFF_NAV[number]["id"]) => {
    openSection(id)
    onNavigate?.()
  }

  const shiftActive = Boolean(shift.startedAt) && !shift.endedAt
  const shiftTime = shift.startedAt
    ? new Date(shift.startedAt)
    : null
  const validShiftTime =
    shiftTime && !Number.isNaN(shiftTime.getTime())
      ? shiftTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : ""

  return (
    <div className="flex h-full flex-col staff-sidebar">
      {}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3.5">
        <div className="sf-logo-mark" aria-hidden="true">
          <span>Y</span>
        </div>
        <div className="min-w-0">
          <div
            className="font-bold text-[15px] tracking-[-0.2px] text-[#f8f4eb] truncate"
            style={{ fontFamily: '"Manrope", sans-serif' }}
          >
            {t("staff", "brandName")}
          </div>
          <div className="text-[8px] font-bold uppercase tracking-[2.4px] text-[#a8a99f] mt-0.5">
            {t("staff", "brandWorkspace")}
          </div>
        </div>
      </div>

      {}
      <nav
        className="flex-1 overflow-y-auto px-4 pb-4 space-y-5"
        aria-label={t("staff", "sidebarNavLabel")}
      >
        {NAV_GROUPS.map((group) => {
          const items = visible.filter((item) => item.group === group.id)
          if (!items.length) return null
          return (
            <div key={group.id}>
              <div className="sf-nav-label px-2.5 mb-2 uppercase font-bold">
                {t("staff", group.labelKey)}
              </div>
              <ul className="space-y-1">
                {items.map((item) => {
                  const active = tab === item.id
                  const count = item.badge ? badges[item.badge] : 0
                  const Icon = item.icon
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => navigate(item.id)}
                        aria-current={active ? "page" : undefined}
                        className={`sf-nav-item group flex w-full items-center gap-3 px-3 py-2.5 text-left text-[12px] font-semibold ${
                          active ? "active" : ""
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            active
                              ? "text-[#d6bd8c]"
                              : "text-[#777d74] group-hover:text-[#d6bd8c]"
                          }`}
                        />
                        <span className="flex-1 truncate">
                          {t("staff", item.labelKey)}
                        </span>
                        {count > 0 && (
                          <span
                            className={`sf-nav-badge grid place-items-center font-bold ${
                              active
                                ? ""
                                : item.badge === "tasks"
                                  ? LEVEL_STYLES.urgent
                                  : ""
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {}
      <div className="border-t border-[#353a33] p-4 space-y-3">
        {/* Active shift schedule card */}
        <div className="sf-shift-card">
          <button
            type="button"
            onClick={() => navigate("shift")}
            className="group w-full px-3 py-2.5 text-left hover:bg-white/5 rounded-[8px] transition-colors"
          >
            <span className="flex items-center gap-2">
              {shiftActive && <i className="sf-live-dot" aria-hidden="true" />}
              <span className="text-[8px] font-bold uppercase tracking-[1.6px] text-[#cbb07b]">
                {shiftActive
                  ? t("staff", "shiftCardActive")
                  : t("staff", "shiftCardNone")}
              </span>
            </span>
            <span className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] font-semibold text-[#f8f4eb]">
                {shiftActive && validShiftTime
                  ? t("staff", "shiftStartedAt", { time: validShiftTime })
                  : t("staff", "navShift")}
              </span>
              <span className="flex items-center gap-1 text-[9px] font-bold text-[#8c9188] group-hover:text-[#cbb07b]">
                {shiftActive ? t("staff", "shiftCardView") : ""}
                <ChevronRight className="h-3 w-3" />
              </span>
            </span>
          </button>
        </div>

        <HotelSwitcher />

        <button
          type="button"
          onClick={() => navigate("profile")}
          className="sf-profile-row flex w-full items-center gap-2.5 pt-3 px-1 text-left hover:bg-white/5 rounded-lg transition-colors"
        >
          <span className="sf-avatar">
            {user?.fullName?.charAt(0).toUpperCase() || (
              <UserCircle2 className="h-4 w-4" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-bold text-[#f8f4eb]">
              {user?.fullName || t("staff", "staffProfileFallback")}
            </span>
            <span className="block truncate text-[9px] text-[#8c9188] mt-0.5">
              {user?.email || "—"}
            </span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-[#777d74]" />
        </button>

        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold ${
              online
                ? "bg-[#7fb49c]/15 text-[#7fb49c]"
                : "bg-[#df776d]/15 text-[#df776d]"
            }`}
            title={
              online
                ? t("staff", "statusOnlineHint")
                : t("staff", "statusOfflineHint")
            }
          >
            {online ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {online ? t("staff", "statusOnline") : t("staff", "statusOffline")}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setHelpOpen((prev) => !prev)}
              aria-label={t("staff", "helpLabel")}
              aria-expanded={helpOpen}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#777d74] hover:bg-white/8 hover:text-white transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            {helpOpen && (
              <div className="absolute bottom-9 right-0 z-50 w-64 rounded-xl border border-[#41473e] bg-[#252925] p-4 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#f8f4eb]">
                    {t("staff", "helpTitle")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHelpOpen(false)}
                    aria-label={t("staff", "btnClose")}
                    className="text-[#777d74] hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <ul className="space-y-2 text-[11px] text-[#979c92]">
                  <li className="flex items-center gap-2">
                    <LifeBuoy className="h-3.5 w-3.5 shrink-0 text-[#cbb07b]" />
                    {t("staff", "helpLine1")}
                  </li>
                  <li className="flex items-center gap-2">
                    <LifeBuoy className="h-3.5 w-3.5 shrink-0 text-[#cbb07b]" />
                    {t("staff", "helpLine2")}
                  </li>
                  <li className="flex items-center gap-2">
                    <LogOut className="h-3.5 w-3.5 shrink-0 text-[#cbb07b]" />
                    {t("staff", "helpLine3")}
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
