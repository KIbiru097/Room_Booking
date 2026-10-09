"use client"

import { useState } from "react"
import {
  BedDouble,
  CalendarCheck2,
  ClipboardPlus,
  LayoutDashboard,
  ListTodo,
  LogIn,
  LogOut,
  MoreHorizontal,
  Plus,
  Sparkles,
  X,
} from "lucide-react"
import type { StaffSectionId } from "./types"
import { useStaffWorkspaceContext } from "./workspace-context"

const TABS: Array<{
  id: StaffSectionId
  labelKey: string
  icon: typeof LayoutDashboard
}> = [
  { id: "overview", labelKey: "mobileTabHome", icon: LayoutDashboard },
  { id: "tasks", labelKey: "mobileTabTasks", icon: ListTodo },
  { id: "reservations", labelKey: "mobileTabBookings", icon: CalendarCheck2 },
  { id: "rooms", labelKey: "mobileTabRooms", icon: BedDouble },
]

export function MobileTabBar() {
  const { tab, openSection, setMobileNavOpen, t } = useStaffWorkspaceContext()
  const [fabOpen, setFabOpen] = useState(false)

  return (
    <>
      {fabOpen && (
        <div className="fixed inset-0 z-[55] lg:hidden">
          <button
            type="button"
            aria-label={t("staff", "btnClose")}
            onClick={() => setFabOpen(false)}
            className="absolute inset-0 bg-[#191a18]/40"
          />
          <div className="absolute bottom-24 right-4 w-56 overflow-hidden rounded-xl border border-[#e4e0d7] dark:border-[#393a35] bg-[#fbfaf7] dark:bg-[#222320] shadow-2xl">
            <QuickAction
              icon={LogIn}
              label={t("staff", "quickCheckIn")}
              onClick={() => {
                setFabOpen(false)
                openSection("reservations")
              }}
            />
            <QuickAction
              icon={Plus}
              label={t("staff", "quickWalkIn")}
              onClick={() => {
                setFabOpen(false)
                openSection("walk-in")
              }}
            />
            <QuickAction
              icon={LogOut}
              label={t("staff", "quickCheckOut")}
              onClick={() => {
                setFabOpen(false)
                openSection("reservations")
              }}
            />
            <QuickAction
              icon={Sparkles}
              label={t("staff", "quickRoomStatus")}
              onClick={() => {
                setFabOpen(false)
                openSection("rooms")
              }}
            />
            <QuickAction
              icon={ClipboardPlus}
              label={t("staff", "quickNewTask")}
              onClick={() => {
                setFabOpen(false)
                openSection("tasks")
              }}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setFabOpen((prev) => !prev)}
        aria-label={
          fabOpen ? t("staff", "btnClose") : t("staff", "quickActionsLabel")
        }
        aria-expanded={fabOpen}
        className="fixed bottom-20 right-4 z-[56] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#2a302a] p-4 text-white shadow-xl shadow-black/25 hover:bg-[#1e211d] transition-colors lg:hidden"
      >
        {fabOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </button>

      <nav
        aria-label={t("staff", "mobileTabBarLabel")}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e4e0d7] dark:border-[#393a35] bg-[#fbfaf7]/94 dark:bg-[#222320]/94 backdrop-blur-xl lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {TABS.map((item) => {
            const active = tab === item.id
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openSection(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors relative ${
                    active
                      ? "text-[#a47c3b] dark:text-[#c09b61]"
                      : "text-[#77746b] dark:text-[#aaa79e]"
                  }`}
                >
                  {active && (
                    <span
                      className="absolute top-0 w-6 h-0.5 bg-[#a47c3b] dark:bg-[#c09b61]"
                      aria-hidden="true"
                    />
                  )}
                  <Icon className="h-4 w-4" />
                  {t("staff", item.labelKey)}
                </button>
              </li>
            )
          })}
          <li>
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label={t("staff", "mobileTabMore")}
              className="flex w-full flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-[#77746b] dark:text-[#aaa79e]"
            >
              <MoreHorizontal className="h-4 w-4" />
              {t("staff", "mobileTabMore")}
            </button>
          </li>
        </ul>
      </nav>
    </>
  )
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof LayoutDashboard
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-xs font-semibold text-[#24231f] dark:text-[#f0eee7] hover:bg-[#f0e8d9] dark:hover:bg-[#30312d]"
    >
      <Icon className="h-4 w-4 text-[#a47c3b]" />
      {label}
    </button>
  )
}
