import type { Booking } from "@/lib/types"
import { formatEthiopianBirr } from "@/lib/currency"

export type StaffSectionId = "overview" | "tasks" | "reservations" | "rooms" | "housekeeping" | "guests" | "stay-requests" | "payments" | "inbox" | "maintenance" | "activity" | "shift" | "ai" | "notifications" | "profile" | "walk-in"

export type Tab = StaffSectionId

export interface StaffBooking extends Omit<Booking, "details"> {
  bookingRef?: string | null
  user?: { fullName: string ;email: string ;phone?: string | null }
  details?: Array<{
    id: string
    roomId: string
    guestInfo?: {
      name?: string
      phone?: string
      email?: string
      nationalId?: string
    }
    room?: { id: string ;roomNumber: string ;type: string ;basePrice?: number }
  }>
}

export interface GuestProfile {
  id: string
  name: string
  email: string
  phone: string
  nationalId?: string
  totalStays: number
  totalSpent: number
  lastVisit: string
  currentRoom?: string
  currentBookingId?: string
  notes?: string
}

export type TaskPriority = "URGENT" | "TODAY" | "UPCOMING"
export type TaskStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED"

export interface StaffTask {
  id: string
  title: string
  detail: string
  priority: TaskPriority
  type: "CHECK_IN" | "HOUSEKEEPING" | "MAINTENANCE" | "GUEST_REQUEST" | "INSPECTION" | "PAYMENT" | "DEPARTURE"
  room?: string
  guest?: string
  bookingId?: string
  createdAt: string
  dueAt?: string
  assignedTo: string
  status: TaskStatus
}

export interface AttentionItem {
  id: string
  level: "urgent" | "attention" | "reminder" | "info"
  title: string
  detail: string
  actionLabel: string
  action: {
    section: StaffSectionId
    bookingId?: string
    roomId?: string
    requestId?: string
  }
}

export interface ActivityEvent {
  id: string
  at: string
  actor: string
  text: string
  kind: "checkin" | "checkout" | "room" | "request" | "payment" | "message" | "booking" | "task"
}

export interface ShiftRecord {
  startedAt: string | null
  endedAt: string | null
  handover: string
  collectedCash: number
}

export const formatDate = (value: string | null | undefined) => {
  if (!value) return "—"
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value))
  } catch {
    return value
  }
}

export const formatMoney = (value: number | string | null | undefined) =>
  value === null || value === undefined ? "—" : formatEthiopianBirr(value)

export const formatClock = (value: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value))
  } catch {
    return value
  }
}

export const formatDuration = (minutes: number) => {
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${Math.round(minutes)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
