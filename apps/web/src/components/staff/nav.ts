import {
  LayoutDashboard,
  ListTodo,
  CalendarCheck2,
  BedDouble,
  Sparkles,
  Users,
  Inbox,
  Wallet,
  MessageSquareText,
  Wrench,
  History,
  Clock4,
  Bot,
  Bell,
  UserCircle2,
  type LucideIcon,
} from "lucide-react"
import type { StaffSectionId } from "./types"

export interface StaffNavItem {
  id: StaffSectionId
  labelKey: string
  icon: LucideIcon
  /** Hidden when the signed-in staff member lacks this capability. */
  capability?: string
  /** Counted for the sidebar badge. */
  badge?: "tasks" | "requests" | "inbox" | "maintenance" | "notifications"
  mobile?: boolean
  group: "command" | "operations" | "service" | "insight"
}

export const STAFF_NAV: StaffNavItem[] = [
  {
    id: "overview",
    labelKey: "navOverview",
    icon: LayoutDashboard,
    mobile: true,
    group: "command",
  },
  {
    id: "tasks",
    labelKey: "navTasks",
    icon: ListTodo,
    badge: "tasks",
    mobile: true,
    group: "command",
  },
  {
    id: "reservations",
    labelKey: "navReservations",
    icon: CalendarCheck2,
    capability: "booking.view",
    mobile: true,
    group: "operations",
  },
  {
    id: "rooms",
    labelKey: "navRooms",
    icon: BedDouble,
    capability: "room.view",
    group: "operations",
  },
  {
    id: "housekeeping",
    labelKey: "navHousekeeping",
    icon: Sparkles,
    capability: "housekeeping.view",
    group: "operations",
  },
  {
    id: "guests",
    labelKey: "navGuests",
    icon: Users,
    capability: "guest.view",
    group: "service",
  },
  {
    id: "stay-requests",
    labelKey: "navStayRequests",
    icon: Inbox,
    badge: "requests",
    group: "service",
  },
  {
    id: "payments",
    labelKey: "navPayments",
    icon: Wallet,
    capability: "payment.view",
    group: "service",
  },
  {
    id: "inbox",
    labelKey: "navInbox",
    icon: MessageSquareText,
    badge: "inbox",
    group: "service",
  },
  {
    id: "maintenance",
    labelKey: "navMaintenance",
    icon: Wrench,
    capability: "maintenance.view",
    badge: "maintenance",
    group: "operations",
  },
  { id: "activity", labelKey: "navActivity", icon: History, group: "insight" },
  { id: "shift", labelKey: "navShift", icon: Clock4, group: "insight" },
  { id: "ai", labelKey: "navAi", icon: Bot, group: "insight" },
  {
    id: "notifications",
    labelKey: "navNotifications",
    icon: Bell,
    badge: "notifications",
    group: "insight",
  },
  {
    id: "profile",
    labelKey: "navProfile",
    icon: UserCircle2,
    mobile: true,
    group: "insight",
  },
]

export const NAV_GROUPS: Array<{
  id: StaffNavItem["group"]
  labelKey: string
}> = [
  { id: "command", labelKey: "navGroupCommand" },
  { id: "operations", labelKey: "navGroupOperations" },
  { id: "service", labelKey: "navGroupService" },
  { id: "insight", labelKey: "navGroupInsight" },
]

export const MOBILE_NAV_IDS: StaffSectionId[] = STAFF_NAV.filter(
  (item) => item.mobile,
).map((item) => item.id)

export const ALL_SECTION_IDS: StaffSectionId[] = STAFF_NAV.map(
  (item) => item.id,
)
