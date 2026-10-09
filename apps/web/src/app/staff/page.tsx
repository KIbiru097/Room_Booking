"use client"

import { useEffect, type ComponentType } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, X } from "lucide-react"
import AuthGate from "@/components/AuthGate"
import { useAuth } from "@/lib/auth-store"
import { useLanguage } from "@/lib/i18n"
import { StaffSidebar } from "@/components/staff/StaffSidebar"
import { MobileNavDrawer, StaffTopbar } from "@/components/staff/StaffTopbar"
import { MobileTabBar } from "@/components/staff/MobileTabBar"
import { NotificationDrawer } from "@/components/staff/NotificationDrawer"
import { useStaffWorkspace } from "@/components/staff/use-staff-workspace"
import {
  StaffWorkspaceProvider,
  useStaffWorkspaceContext,
} from "@/components/staff/workspace-context"
import type { StaffSectionId } from "@/components/staff/types"
import { ActivitySection } from "@/components/staff/sections/ActivitySection"
import { AiSection } from "@/components/staff/sections/AiSection"
import { GuestsSection } from "@/components/staff/sections/GuestsSection"
import { HousekeepingSection } from "@/components/staff/sections/HousekeepingSection"
import { InboxSection } from "@/components/staff/sections/InboxSection"
import { MaintenanceSection } from "@/components/staff/sections/MaintenanceSection"
import { NotificationsSection } from "@/components/staff/sections/NotificationsSection"
import { OverviewSection } from "@/components/staff/sections/OverviewSection"
import { PaymentsSection } from "@/components/staff/sections/PaymentsSection"
import { ProfileSection } from "@/components/staff/sections/ProfileSection"
import { ReservationsSection } from "@/components/staff/sections/ReservationsSection"
import { RoomsSection } from "@/components/staff/sections/RoomsSection"
import { ShiftSection } from "@/components/staff/sections/ShiftSection"
import { StaffModals } from "@/components/staff/sections/StaffModals"
import { StayRequestsSection } from "@/components/staff/sections/StayRequestsSection"
import { TasksSection } from "@/components/staff/sections/TasksSection"
import { WalkInSection } from "@/components/staff/sections/WalkInSection"

const SECTIONS: Record<StaffSectionId, ComponentType> = {
  overview: OverviewSection,
  tasks: TasksSection,
  reservations: ReservationsSection,
  rooms: RoomsSection,
  housekeeping: HousekeepingSection,
  guests: GuestsSection,
  "stay-requests": StayRequestsSection,
  payments: PaymentsSection,
  inbox: InboxSection,
  maintenance: MaintenanceSection,
  activity: ActivitySection,
  shift: ShiftSection,
  ai: AiSection,
  notifications: NotificationsSection,
  profile: ProfileSection,
  "walk-in": WalkInSection,
}

export default function StaffDashboardPage() {
  const router = useRouter()
  const { user, isInitialized } = useAuth()
  const { t } = useLanguage()

  useEffect(() => {
    if (isInitialized && user?.role === "MANAGER") {
      router.replace("/manager")
    }
  }, [user, isInitialized, router])

  if (!isInitialized) {
    return (
      <div className="staff-shell min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#a47c3b] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (user?.role === "MANAGER") {
    return (
      <div className="staff-shell min-h-screen flex items-center justify-center">
        {t("staff", "redirectingToManager")}
      </div>
    )
  }

  return (
    <AuthGate roles={["STAFF", "ADMIN"]}>
      <StaffWorkspaceShell />
    </AuthGate>
  )
}

function StaffWorkspaceShell() {
  const workspace = useStaffWorkspace()

  if (workspace.loading) {
    return (
      <div className="staff-shell min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#a47c3b] border-t-transparent animate-spin" />
          <span className="text-xs font-semibold">
            {workspace.t("staff", "loadingPortal")}
          </span>
        </div>
      </div>
    )
  }

  return (
    <StaffWorkspaceProvider workspace={workspace}>
      <WorkspaceLayout />
    </StaffWorkspaceProvider>
  )
}

function WorkspaceLayout() {
  const { t, tab, error, setError, successBanner, setSuccessBanner } =
    useStaffWorkspaceContext()
  const Section = SECTIONS[tab] ?? OverviewSection

  return (
    <div className="staff-shell min-h-screen flex transition-colors duration-200">
      <aside className="staff-sidebar w-64 flex-shrink-0 hidden lg:flex flex-col z-20">
        <StaffSidebar />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <StaffTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                className="text-rose-600 dark:text-rose-400 hover:text-rose-900 p-1 rounded-lg hover:bg-rose-100/60 dark:hover:bg-rose-900/60 transition-colors"
                aria-label={t("staff", "dismissNotification")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {successBanner && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{successBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessBanner("")}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100/60 dark:hover:bg-emerald-900/60 transition-colors"
                aria-label={t("staff", "dismissNotification")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <Section />
        </main>
      </div>

      <MobileNavDrawer />
      <NotificationDrawer />
      <MobileTabBar />
      <StaffModals />
    </div>
  )
}
