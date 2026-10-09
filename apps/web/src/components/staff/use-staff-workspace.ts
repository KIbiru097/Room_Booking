"use client"
// Storage unavailable (private mode) — state still lives in memory.
// identity + chrome

// navigation

// feeds

// derived ops

// board filters

// mutations

// walk-in wizard

// inbox

// ai copilot

// guest notes

// notifications
// Notifications are non-blocking.

import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  contactApi,
  managerApi,
  notificationApi,
  paymentApi,
} from "@/lib/services"
import { useAuth } from "@/lib/auth-store"
import { useLanguage } from "@/lib/i18n"
import type {
  ContactThread,
  Hotel,
  Notification,
  OperationalRoom,
  Room,
  StayRequest,
} from "@/lib/types"
import type {
  ActivityEvent,
  ShiftRecord,
  StaffBooking,
  StaffSectionId,
  StaffTask,
} from "./types"
import type { TaskOverrides } from "./derive-ops"
import {
  buildHotelPulse,
  buildOpsSnapshot,
  mergeGuestProfiles,
  type HotelPulse,
  type OpsInput,
} from "./derive-ops"
import {
  buildCapabilities,
  defaultCapabilities,
  type CapabilitySet,
} from "./permissions"

const SHIFT_KEY = "luxstay-staff-shift"
const TASK_KEY = "luxstay-staff-task-overrides"
const ACTIVITY_KEY = "luxstay-staff-activity"
const ALERT_KEY = "luxstay-staff-alerts"
const THEME_KEY = "luxstay-theme"

const readJson = <T>(key: string, fallback: T): T => {
  if (
    typeof window ===
    "undefined"
  )
    return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

const writeJson = (key: string, value: unknown) => {
  if (
    typeof window ===
    "undefined"
  )
    return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

const emptyShift: ShiftRecord = {
  startedAt: null,
  endedAt: null,
  handover: "",
  collectedCash: 0,
}

export interface StaffWorkspace {
  router: ReturnType<typeof useRouter>
  user: ReturnType<typeof useAuth.getState>["user"]
  language: ReturnType<typeof useLanguage>["language"]
  setLanguage: ReturnType<typeof useLanguage>["setLanguage"]
  t: ReturnType<typeof useLanguage>["t"]
  logout: () => void
  isDark: boolean
  toggleStaffTheme: () => void
  profileOpen: boolean
  setProfileOpen: (open: boolean) => void
  notificationsOpen: boolean
  setNotificationsOpen: (open: boolean) => void
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  globalSearch: string
  setGlobalSearch: (value: string) => void
  tab: StaffSectionId
  setTab: (section: StaffSectionId) => void
  openSection: (section: StaffSectionId) => void
  loading: boolean
  error: string
  setError: (message: string) => void
  successBanner: string
  setSuccessBanner: (message: string) => void
  acting: string | null
  refresh: () => Promise<void>
  hotels: Hotel[]
  hotelPulse: HotelPulse[]
  selectedHotelId: string
  setSelectedHotelId: (hotelId: string) => void
  selectedHotel: Hotel | undefined
  roomsByHotel: Record<string, OperationalRoom[]>
  operationalRooms: OperationalRoom[]
  roomsLoading: boolean
  availableRooms: Room[]
  bookings: StaffBooking[]
  allBookings: StaffBooking[]
  stats: {
    pendingApprovals: number
    todaysCheckIns: number
    todaysCheckOuts: number
    activeGuests: number
  }
  stayRequests: StayRequest[]
  contactThreads: ContactThread[]
  notifications: Notification[]
  unreadNotifications: number
  capabilities: CapabilitySet
  ops: ReturnType<typeof buildOpsSnapshot>
  statusLabel: (status: string) => string
  roomTypeLabel: (type: string) => string
  taskOverrides: Record<string, TaskOverrides>
  setTaskStatus: (taskId: string, status: TaskOverrides["status"]) => void
  reassignTask: (taskId: string, assignee: string) => void
  addTaskNote: (taskId: string, note: string) => void
  recordActivity: (kind: ActivityEvent["kind"], text: string) => void
  localActivity: ActivityEvent[]
  acknowledgedAlerts: Record<string, number>
  acknowledgeAlert: (id: string) => void
  snoozeAlert: (id: string, minutes: number) => void
  shift: ShiftRecord
  startShift: () => void
  endShift: (handover: string, collectedCash: number) => void
  updateHandover: (text: string) => void
  statusFilter: "ALL" | "AVAILABLE" | "CLEANING" | "MAINTENANCE" | "OCCUPIED"
  setStatusFilter: (
    value: "ALL" | "AVAILABLE" | "CLEANING" | "MAINTENANCE" | "OCCUPIED",
  ) => void
  roomSearchQuery: string
  setRoomSearchQuery: (value: string) => void
  bookingStatusFilter: string
  setBookingStatusFilter: (value: string) => void
  bookingDateFilter: "ALL" | "TODAY" | "UPCOMING" | "PAST"
  setBookingDateFilter: (
    value: "ALL" | "TODAY" | "UPCOMING" | "PAST",
  ) => void
  bookingRoomFilter: string
  setBookingRoomFilter: (value: string) => void
  bookingSearchQuery: string
  setBookingSearchQuery: (value: string) => void
  paymentStatusFilter: string
  setPaymentStatusFilter: (value: string) => void
  guestViewMode: "list" | "grid"
  setGuestViewMode: (value: "list" | "grid") => void
  guestSearchQuery: string
  setGuestSearchQuery: (value: string) => void
  guestFilterStatus: "ALL" | "IN_HOUSE" | "PAST"
  setGuestFilterStatus: (value: "ALL" | "IN_HOUSE" | "PAST") => void
  guestProfiles: ReturnType<typeof mergeGuestProfiles>
  filteredGuestProfiles: ReturnType<typeof mergeGuestProfiles>
  filteredBookings: StaffBooking[]
  searchResults: Array<{
    kind: "booking" | "room"
    id: string
    label: string
    detail: string
  }>
  updateRoomStatus: (
    roomId: string,
    status: "AVAILABLE" | "CLEANING" | "MAINTENANCE",
  ) => Promise<void>
  handleUpdateRoomStatus: (
    roomId: string,
    status: "AVAILABLE" | "CLEANING" | "MAINTENANCE",
  ) => Promise<void>
  updatingRoomId: string | null
  act: (
    id: string,
    action: "confirm" | "reject" | "check-in" | "check-out",
  ) => Promise<void>
  markCashPaid: (bookingId: string) => Promise<void>
  openNoShowModal: (booking: StaffBooking) => void
  noShowModalBooking: StaffBooking | null
  setNoShowModalBooking: (booking: StaffBooking | null) => void
  noShowSubmitting: boolean
  confirmNoShow: () => Promise<void>
  rejectingBooking: StaffBooking | null
  setRejectingBooking: (booking: StaffBooking | null) => void
  rejectReason: string
  setRejectReason: (value: string) => void
  rejectSubmitting: boolean
  handleConfirmRejectBooking: () => Promise<void>
  relocateBooking: StaffBooking | null
  setRelocateBooking: (booking: StaffBooking | null) => void
  relocateNewRoomId: string
  setRelocateNewRoomId: (value: string) => void
  relocateReason: string
  setRelocateReason: (value: string) => void
  relocateSubmitting: boolean
  handleRelocateSubmit: (event: React.FormEvent) => Promise<void>
  timeAdjustBooking: {
    booking: StaffBooking
    type: "EARLY_IN" | "LATE_OUT"
  } | null
  setTimeAdjustBooking: (
    value: { booking: StaffBooking ;type: "EARLY_IN" | "LATE_OUT" } | null,
  ) => void
  timeAdjustFee: number
  setTimeAdjustFee: (value: number) => void
  timeAdjustReason: string
  setTimeAdjustReason: (value: string) => void
  timeAdjustSubmitting: boolean
  handleTimeAdjustmentSubmit: () => Promise<void>
  decidingRequest: StayRequest | null
  setDecidingRequest: (value: StayRequest | null) => void
  decisionNote: string
  setDecisionNote: (value: string) => void
  decidingSubmitting: boolean
  handleDecideStayRequest: (decision: "APPROVED" | "REJECTED") => Promise<void>
  walkInModalOpen: boolean
  setWalkInModalOpen: (open: boolean) => void
  walkInStep: number
  setWalkInStep: React.Dispatch<React.SetStateAction<number>>
  walkInSubmitting: boolean
  walkInForm: {
    hotelId: string
    roomId: string
    guestName: string
    guestPhone: string
    guestEmail: string
    guestIdNumber: string
    checkIn: string
    checkOut: string
    paymentMethod: string
    paidImmediately: boolean
  }
  setWalkInForm: React.Dispatch<React.SetStateAction<StaffWorkspace["walkInForm"]>>
  handleWalkInSubmit: (event?: React.FormEvent) => Promise<void>
  walkInRoom: Room | undefined
  walkInNights: number
  walkInEstimatedTotal: number
  activeThread: ContactThread | null
  setActiveThread: (thread: ContactThread | null) => void
  threadReply: string
  setThreadReply: (value: string) => void
  threadSubmitting: boolean
  handleSendThreadReply: () => Promise<void>
  handleResolveThread: (threadId: string) => Promise<void>
  aiAssistantOpen: boolean
  setAiAssistantOpen: (open: boolean) => void
  aiQuery: string
  setAiQuery: (value: string) => void
  aiMessages: Array<{ role: "assistant" | "user" ;text: string ;time: string }>
  aiLoading: boolean
  handleAiAsk: (query: string) => void
  guestNotes: Record<string, string>
  setGuestNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>
  activeGuestNoteId: string | null
  setActiveGuestNoteId: (value: string | null) => void
  activeGuestNoteText: string
  setActiveGuestNoteText: (value: string) => void
  markNotificationRead: (notification: Notification) => void
  markAllNotificationsRead: () => void

  handleLogout: () => void
}

export function useStaffWorkspace(): StaffWorkspace {
  const router = useRouter()
  const logout = useAuth((state) => state.logout)
  const user = useAuth((state) => state.user)
  const { language, setLanguage, t } = useLanguage()

  const [isDark, setIsDark] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState("")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [capabilities, setCapabilities] =
    useState<CapabilitySet>(defaultCapabilities)

  const [tab, setTabState] = useState<StaffSectionId>("overview")
  const [bookingsRaw, setBookingsRaw] = useState<StaffBooking[]>([])
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    todaysCheckIns: 0,
    todaysCheckOuts: 0,
    activeGuests: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [successBanner, setSuccessBanner] = useState("")
  const [acting, setActing] = useState<string | null>(null)

  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotelId, setSelectedHotelIdState] = useState<string>("")
  const [roomsByHotel, setRoomsByHotel] =
    useState<Record<string, OperationalRoom[]>>({})
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "AVAILABLE" | "CLEANING" | "MAINTENANCE" | "OCCUPIED">(
      "ALL",
    )
  const [roomSearchQuery, setRoomSearchQuery] = useState("")
  const [updatingRoomId, setUpdatingRoomId] = useState<string | null>(null)
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])

  const [stayRequests, setStayRequests] = useState<StayRequest[]>([])
  const [contactThreads, setContactThreads] = useState<ContactThread[]>([])
  const [activeThread, setActiveThread] = useState<ContactThread | null>(null)
  const [threadReply, setThreadReply] = useState("")
  const [threadSubmitting, setThreadSubmitting] = useState(false)

  const [walkInModalOpen, setWalkInModalOpen] = useState(false)
  const [walkInStep, setWalkInStep] = useState(1)
  const [walkInSubmitting, setWalkInSubmitting] = useState(false)
  const [walkInForm, setWalkInForm] = useState({
    hotelId: "",
    roomId: "",
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    guestIdNumber: "",
    checkIn: new Date().toISOString().slice(0, 10),
    checkOut: new Date(
      Date.now() +
        86400000,
    )
      .toISOString()
      .slice(0, 10),
    paymentMethod: "CASH",
    paidImmediately: true,
  })

  const [relocateBooking, setRelocateBooking] = useState<StaffBooking | null>(
    null,
  )
  const [relocateNewRoomId, setRelocateNewRoomId] = useState("")
  const [relocateReason, setRelocateReason] = useState(
    t("staff", "defaultRelocateReason"),
  )
  const [relocateSubmitting, setRelocateSubmitting] = useState(false)

  const [decidingRequest, setDecidingRequest] = useState<StayRequest | null>(
    null,
  )
  const [decisionNote, setDecisionNote] = useState("")
  const [decidingSubmitting, setDecidingSubmitting] = useState(false)

  const [noShowModalBooking, setNoShowModalBooking] =
    useState<StaffBooking | null>(null)
  const [noShowSubmitting, setNoShowSubmitting] = useState(false)

  const [rejectingBooking, setRejectingBooking] = useState<StaffBooking | null>(
    null,
  )
  const [rejectReason, setRejectReason] = useState("")
  const [rejectSubmitting, setRejectSubmitting] = useState(false)

  const [timeAdjustBooking, setTimeAdjustBooking] = useState<{
    booking: StaffBooking
    type: "EARLY_IN" | "LATE_OUT"
  } | null>(null)
  const [timeAdjustFee, setTimeAdjustFee] = useState<number>(0)
  const [timeAdjustReason, setTimeAdjustReason] = useState("")
  const [timeAdjustSubmitting, setTimeAdjustSubmitting] = useState(false)

  const [aiAssistantOpen, setAiAssistantOpen] = useState(false)
  const [aiQuery, setAiQuery] = useState("")
  const [aiMessages, setAiMessages] = useState<Array<{
    role: "assistant" | "user"
    text: string
    time: string
  }>>([
    {
      role: "assistant",
      text: "Operations Copilot ready. Ask me about arrivals, room readiness, open tasks, or your shift handover.",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ])
  const [aiLoading, setAiLoading] = useState(false)

  const [guestNotes, setGuestNotes] = useState<Record<string, string>>({})
  const [activeGuestNoteId, setActiveGuestNoteId] = useState<string | null>(
    null,
  )
  const [activeGuestNoteText, setActiveGuestNoteText] = useState("")
  const [guestViewMode, setGuestViewMode] = useState<"list" | "grid">("list")
  const [guestSearchQuery, setGuestSearchQuery] = useState("")
  const [guestFilterStatus, setGuestFilterStatus] =
    useState<"ALL" | "IN_HOUSE" | "PAST">("ALL")

  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("ALL")
  const [bookingDateFilter, setBookingDateFilter] = useState<
    "ALL" | "TODAY" | "UPCOMING" | "PAST"
  >("ALL")
  const [bookingRoomFilter, setBookingRoomFilter] = useState<string>("ALL")
  const [bookingSearchQuery, setBookingSearchQuery] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("ALL")

  const [taskOverrides, setTaskOverrides] =
    useState<Record<string, TaskOverrides>>({})
  const [localActivity, setLocalActivity] = useState<ActivityEvent[]>([])
  const [acknowledgedAlerts, setAcknowledgedAlerts] =
    useState<Record<string, number>>({})
  const [shift, setShift] = useState<ShiftRecord>(emptyShift)

  const statusLabel = (status: string) => {
    if (
      status ===
      "PENDING"
    )
      return t("staff", "statusPending")
    if (
      status ===
      "CONFIRMED"
    )
      return t("staff", "statusConfirmed")
    if (
      status ===
      "CHECKED_IN"
    )
      return t("staff", "statusCheckedIn")
    if (
      status ===
      "CHECKED_OUT"
    )
      return t("staff", "statusCheckedOut")
    if (
      status ===
      "CANCELLED"
    )
      return t("staff", "statusCancelled")
    if (
      status ===
      "REJECTED"
    )
      return t("staff", "statusRejected")
    if (
      status ===
      "APPROVED"
    )
      return t("staff", "statusApproved")
    if (
      status ===
      "AVAILABLE"
    )
      return t("staff", "statusAvailable")
    if (
      status ===
      "CLEANING"
    )
      return t("staff", "statusCleaning")
    if (
      status ===
      "MAINTENANCE"
    )
      return t("staff", "statusMaintenance")
    if (
      status ===
      "UNAVAILABLE"
    )
      return t("staff", "statusUnavailable")
    if (
      status ===
        "SUCCEEDED" ||
      status ===
        "PAID"
    )
      return t("staff", "statusPaid")
    if (
      status ===
      "PARTIALLY_PAID"
    )
      return t("staff", "statusPartiallyPaid")
    if (
      status ===
      "UNPAID"
    )
      return t("staff", "statusUnpaid")
    if (
      status ===
      "NO_SHOW"
    )
      return t("staff", "statusNoShow")
    if (
      status ===
      "FAILED"
    )
      return t("staff", "statusFailed")
    if (
      status ===
      "ACTIVE"
    )
      return t("staff", "statusActive")
    return status
  }

  const roomTypeLabel = (type: string) => {
    if (
      type ===
      "SINGLE"
    )
      return t("staff", "roomTypeSingle")
    if (
      type ===
      "DOUBLE"
    )
      return t("staff", "roomTypeDouble")
    if (
      type ===
      "SUITE"
    )
      return t("staff", "roomTypeSuite")
    if (
      type ===
      "DELUXE"
    )
      return t("staff", "roomTypeDeluxe")
    if (
      type ===
      "PRESIDENTIAL"
    )
      return t("staff", "roomTypePresidential")
    return type.replace(/_/g, " ")
  }

  useEffect(() => {
    setTaskOverrides(readJson<Record<string, TaskOverrides>>(TASK_KEY, {}))
    setLocalActivity(readJson<ActivityEvent[]>(ACTIVITY_KEY, []))
    setAcknowledgedAlerts(readJson<Record<string, number>>(ALERT_KEY, {}))
    setShift(readJson<ShiftRecord>(SHIFT_KEY, emptyShift))
  }, [])

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_KEY)
    const prefersDark =
      storedTheme ===
        "dark" ||
      (!storedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    setIsDark(prefersDark)
    document.documentElement.classList.toggle("dark", prefersDark)
    document.documentElement.style.colorScheme = prefersDark ? "dark" : "light"
  }, [])

  const toggleStaffTheme = () => {
    setIsDark((prev) => {
      const next = !prev
      document.documentElement.classList.toggle("dark", next)
      document.documentElement.style.colorScheme = next ? "dark" : "light"
      window.localStorage.setItem(THEME_KEY, next ? "dark" : "light")
      return next
    })
  }

  useEffect(() => {
    if (!successBanner) return
    const timer = setTimeout(() => setSuccessBanner(""), 5000)
    return () => clearTimeout(timer)
  }, [successBanner])

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(""), 7000)
    return () => clearTimeout(timer)
  }, [error])

  const recordActivity = useCallback(
    (kind: ActivityEvent["kind"], text: string) => {
      setLocalActivity((prev) => {
        const next = [
          {
            id: `local:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
            at: new Date().toISOString(),
            actor: "You",
            text,
            kind,
          },
          ...prev,
        ].slice(0, 120)
        writeJson(ACTIVITY_KEY, next)
        return next
      })
    },
    [],
  )

  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationApi.list(1)
      setNotifications(response.data.slice(0, 20))
      setUnreadNotifications(response.unreadCount)
    } catch {}
  }, [])

  const loadRoomsForHotels = useCallback(async (ids: string[]) => {
    if (!ids.length) return
    setRoomsLoading(true)
    try {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            return [id, await managerApi.getOperationalRooms(id)] as const
          } catch {
            return [id, [] as OperationalRoom[]] as const
          }
        }),
      )
      setRoomsByHotel(Object.fromEntries(entries))
    } finally {
      setRoomsLoading(false)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [bookingData, statsData, hotelsData] = await Promise.all([
        managerApi.bookings({ pageSize: 200 }),
        managerApi.stats().catch(() => ({
          pendingApprovals: 0,
          todaysCheckIns: 0,
          todaysCheckOuts: 0,
          activeGuests: 0,
        })),
        managerApi.hotels().catch(() => [] as Hotel[]),
      ])

      setBookingsRaw(bookingData.data as StaffBooking[])
      setStats(statsData)
      setHotels(hotelsData)

      const hotelIds = hotelsData.map((hotel) => hotel.id)
      setSelectedHotelIdState((current) => {
        if (current && hotelIds.includes(current)) return current
        return hotelIds[0] ?? ""
      })

      if (hotelsData[0]?.rooms) setAvailableRooms(hotelsData[0].rooms)
      void loadRoomsForHotels(hotelIds)
      await loadNotifications()
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("staff", "errLoadDashboard"),
      )
    } finally {
      setLoading(false)
    }
  }, [loadNotifications, loadRoomsForHotels, t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!selectedHotelId) return
    setWalkInForm((prev) =>
      prev.hotelId === selectedHotelId
        ? prev
        : { ...prev, hotelId: selectedHotelId },
    )
  }, [selectedHotelId])

  useEffect(() => {
    if (!selectedHotelId) return
    managerApi
      .listStayRequests(selectedHotelId)
      .then(setStayRequests)
      .catch(() => setStayRequests([]))
    contactApi
      .listThreads(selectedHotelId)
      .then(setContactThreads)
      .catch(() => setContactThreads([]))
  }, [selectedHotelId])

  useEffect(() => {
    if (!user?.id || !selectedHotelId) return
    let cancelled = false
    managerApi
      .staffRoles(user.id, selectedHotelId)
      .then((rows: unknown) => {
        if (cancelled || !Array.isArray(rows)) return
        const keys = new Set<string>()
        for (const row of rows) {
          const permissions =
            (row as { role?: { permissions?: unknown } })?.role?.permissions ??
            (row as { permissions?: unknown })?.permissions
          if (!Array.isArray(permissions)) continue
          for (const permission of permissions) {
            const key =
              typeof permission === "string"
                ? permission
                : ((permission as { permission?: { key?: string } })?.permission
                    ?.key ?? (permission as { key?: string })?.key)
            if (key) keys.add(key)
          }
        }
        if (keys.size) setCapabilities(buildCapabilities([...keys]))
      })
      .catch(() => {
        if (!cancelled) setCapabilities(defaultCapabilities)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id, selectedHotelId])

  const setSelectedHotelId = (hotelId: string) => {
    setSelectedHotelIdState(hotelId)
    const current = hotels.find((hotel) => hotel.id === hotelId)
    if (current?.rooms) setAvailableRooms(current.rooms)
    setWalkInForm((prev) => ({ ...prev, hotelId }))
    if (roomsByHotel[hotelId]) return
    void loadRoomsForHotels([hotelId])
  }

  const refresh = useCallback(async () => {
    await Promise.all([load(), loadNotifications()])
  }, [load, loadNotifications])

  const operationalRooms = useMemo(
    () => (selectedHotelId ? (roomsByHotel[selectedHotelId] ?? []) : []),
    [roomsByHotel, selectedHotelId],
  )

  const bookings = useMemo(
    () =>
      selectedHotelId
        ? bookingsRaw.filter((booking) => booking.hotelId === selectedHotelId)
        : bookingsRaw,
    [bookingsRaw, selectedHotelId],
  )

  const ops = useMemo(() => {
    const input: OpsInput = {
      hotelId: selectedHotelId,
      hotelName:
        hotels.find((hotel) => hotel.id === selectedHotelId)?.name ?? "",
      bookings,
      rooms: operationalRooms,
      stayRequests,
      threads: contactThreads,
      notifications,
      taskOverrides,
      localActivity,
    }
    return buildOpsSnapshot(input)
  }, [
    selectedHotelId,
    hotels,
    bookings,
    operationalRooms,
    stayRequests,
    contactThreads,
    notifications,
    taskOverrides,
    localActivity,
  ])

  const hotelPulse = useMemo(() => {
    const tasksByHotel: Record<string, StaffTask[]> = {}
    for (const hotel of hotels) {
      const rooms = roomsByHotel[hotel.id] ?? []
      const hotelBookings = bookingsRaw.filter(
        (booking) => booking.hotelId === hotel.id,
      )
      const snapshot = buildOpsSnapshot({
        hotelId: hotel.id,
        hotelName: hotel.name,
        bookings: hotelBookings,
        rooms,
        stayRequests: hotel.id === selectedHotelId ? stayRequests : [],
        threads: hotel.id === selectedHotelId ? contactThreads : [],
        notifications: [],
        taskOverrides,
        localActivity: [],
      })
      tasksByHotel[hotel.id] = snapshot.tasks.filter(
        (task) => task.status !== "COMPLETED",
      )
    }
    return buildHotelPulse({
      hotels: hotels.map((hotel) => ({ id: hotel.id, name: hotel.name })),
      roomsByHotel,
      bookings: bookingsRaw,
      tasksByHotel,
    })
  }, [
    hotels,
    roomsByHotel,
    bookingsRaw,
    selectedHotelId,
    stayRequests,
    contactThreads,
    taskOverrides,
  ])

  const setTaskStatus = useCallback(
    (taskId: string, status: TaskOverrides["status"]) => {
      setTaskOverrides((prev) => {
        const next = { ...prev, [taskId]: { ...prev[taskId], status } }
        writeJson(TASK_KEY, next)
        return next
      })
      const task = ops.tasks.find((item) => item.id === taskId)
      if (task)
        recordActivity(
          "task",
          `${
            status === "COMPLETED"
              ? "Completed"
              : status === "IN_PROGRESS"
                ? "Started"
                : "Reopened"
          } "${task.title}"`,
        )
    },
    [ops.tasks, recordActivity],
  )

  const reassignTask = useCallback(
    (taskId: string, assignee: string) => {
      setTaskOverrides((prev) => {
        const next = {
          ...prev,
          [taskId]: { ...prev[taskId], assignedTo: assignee },
        }
        writeJson(TASK_KEY, next)
        return next
      })
      recordActivity("task", `Reassigned task to ${assignee}`)
    },
    [recordActivity],
  )

  const addTaskNote = useCallback(
    (taskId: string, note: string) => {
      setTaskOverrides((prev) => {
        const next = { ...prev, [taskId]: { ...prev[taskId], note } }
        writeJson(TASK_KEY, next)
        return next
      })
      recordActivity("task", `Added note to task: ${note}`)
    },
    [recordActivity],
  )

  const acknowledgeAlert = useCallback((id: string) => {
    setAcknowledgedAlerts((prev) => {
      const next = { ...prev, [id]: Date.now() }
      writeJson(ALERT_KEY, next)
      return next
    })
  }, [])

  const snoozeAlert = useCallback((id: string, minutes: number) => {
    setAcknowledgedAlerts((prev) => {
      const next = { ...prev, [id]: Date.now() + minutes * 60000 }
      writeJson(ALERT_KEY, next)
      return next
    })
  }, [])

  const startShift = () => {
    const next: ShiftRecord = {
      startedAt: new Date().toISOString(),
      endedAt: null,
      handover: shift.handover,
      collectedCash: 0,
    }
    setShift(next)
    writeJson(SHIFT_KEY, next)
    recordActivity("task", "Shift started")
  }

  const endShift = (handover: string, collectedCash: number) => {
    const next: ShiftRecord = {
      ...shift,
      endedAt: new Date().toISOString(),
      handover,
      collectedCash,
    }
    setShift(next)
    writeJson(SHIFT_KEY, next)
    recordActivity("task", "Shift ended and handover recorded")
  }

  const updateHandover = (handover: string) => {
    const next = { ...shift, handover }
    setShift(next)
    writeJson(SHIFT_KEY, next)
  }

  const handleUpdateRoomStatus = async (
    roomId: string,
    newStatus: "AVAILABLE" | "CLEANING" | "MAINTENANCE",
  ) => {
    setUpdatingRoomId(roomId)
    setError("")
    try {
      await managerApi.updateRoomStatus(roomId, newStatus)
      setSuccessBanner(
        t("staff", "msgRoomStatusUpdated", { status: statusLabel(newStatus) }),
      )
      setRoomsByHotel((prev) => {
        const next: Record<string, OperationalRoom[]> = {}
        for (const [hotelId, rooms] of Object.entries(prev)) {
          next[hotelId] = rooms.map((room) =>
            room.id === roomId ? { ...room, status: newStatus } : room,
          )
        }
        return next
      })
      const room = operationalRooms.find((item) => item.id === roomId)
      recordActivity(
        "room",
        `Room ${room?.roomNumber ?? ""} set to ${statusLabel(newStatus)}`,
      )
      if (selectedHotelId) await loadRoomsForHotels([selectedHotelId])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("staff", "errUpdateRoomStatus"),
      )
    } finally {
      setUpdatingRoomId(null)
    }
  }

  const act = async (
    id: string,
    action: "confirm" | "reject" | "check-in" | "check-out",
  ) => {
    setActing(id)
    setError("")
    try {
      await managerApi.action(id, action)
      const message =
        action === "confirm"
          ? t("staff", "msgMarkedConfirm")
          : action === "reject"
            ? t("staff", "msgMarkedReject")
            : action === "check-in"
              ? t("staff", "msgMarkedCheckIn")
              : t("staff", "msgMarkedCheckOut")
      setSuccessBanner(message)
      const booking = bookings.find((item) => item.id === id)
      if (booking) {
        recordActivity(
          action === "check-in"
            ? "checkin"
            : action === "check-out"
              ? "checkout"
              : "booking",
          `${message.replace(/\.$/, "")} — ${booking.user?.fullName || booking.bookingRef || id.slice(-8)}`,
        )
      }
      await refresh()
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("staff", "errUpdateReservation"),
      )
    } finally {
      setActing(null)
    }
  }

  const markCashPaid = async (bookingId: string) => {
    setError("")
    try {
      await paymentApi.markCashPaid(bookingId, "Front desk cash collection")
      setSuccessBanner(t("staff", "msgCashPaid"))
      recordActivity(
        "payment",
        `Cash recorded for booking #${bookingId.slice(-8)}`,
      )
      await refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("staff", "errRecordCashPayment"),
      )
    }
  }

  const confirmNoShow = async () => {
    if (!noShowModalBooking) return
    setNoShowSubmitting(true)
    setError("")
    try {
      await managerApi.noShow(noShowModalBooking.id)
      setSuccessBanner(
        t("staff", "msgNoShowMarked", {
          ref: noShowModalBooking.bookingRef ?? "",
        }),
      )
      recordActivity(
        "booking",
        `Marked ${noShowModalBooking.bookingRef ?? ""} as no-show`,
      )
      setNoShowModalBooking(null)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("staff", "errMarkNoShow"))
    } finally {
      setNoShowSubmitting(false)
    }
  }

  const openNoShowModal = (booking: StaffBooking) =>
    setNoShowModalBooking(booking)

  const handleWalkInSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault()
    if (!walkInForm.hotelId || !walkInForm.roomId) return
    setWalkInSubmitting(true)
    setError("")
    try {
      await managerApi.createWalkIn({
        hotelId: walkInForm.hotelId,
        roomIds: [walkInForm.roomId],
        guestName: walkInForm.guestName.trim(),
        guestPhone: walkInForm.guestPhone.trim(),
        guestEmail: walkInForm.guestEmail.trim() || undefined,
        guestIdNumber: walkInForm.guestIdNumber.trim() || undefined,
        checkIn: walkInForm.checkIn,
        checkOut: walkInForm.checkOut,
        paymentMethod: walkInForm.paymentMethod,
        paidImmediately: walkInForm.paidImmediately,
      })
      setSuccessBanner(t("staff", "msgWalkInCreated"))
      recordActivity(
        "checkin",
        `Walk-in registered — ${walkInForm.guestName || "guest"} in room ${walkInRoom?.roomNumber ?? ""}`,
      )
      setWalkInModalOpen(false)
      setWalkInStep(1)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("staff", "errWalkIn"))
    } finally {
      setWalkInSubmitting(false)
    }
  }

  const handleRelocateSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!relocateBooking || !relocateNewRoomId) return
    const oldRoomId = relocateBooking.details?.[0]?.roomId || ""
    setRelocateSubmitting(true)
    setError("")
    try {
      await managerApi.relocateRoom(relocateBooking.id, {
        oldRoomId,
        newRoomId: relocateNewRoomId,
        reason: relocateReason.trim(),
      })
      setSuccessBanner(t("staff", "msgGuestTransferred"))
      recordActivity("room", `Guest relocated to a new room`)
      setRelocateBooking(null)
      await refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("staff", "errTransferGuest"),
      )
    } finally {
      setRelocateSubmitting(false)
    }
  }

  const handleDecideStayRequest = async (decision: "APPROVED" | "REJECTED") => {
    if (!decidingRequest) return
    setDecidingSubmitting(true)
    setError("")
    try {
      await managerApi.decideStayRequest(decidingRequest.id, {
        decision,
        decisionNote: decisionNote.trim() || undefined,
      })
      setSuccessBanner(
        decision === "APPROVED"
          ? t("staff", "msgStayRequestApproved")
          : t("staff", "msgStayRequestRejected"),
      )
      recordActivity(
        "request",
        `Stay request ${decision === "APPROVED" ? "approved" : "rejected"}`,
      )
      setDecidingRequest(null)
      setDecisionNote("")
      await refresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("staff", "errProcessStayRequest"),
      )
    } finally {
      setDecidingSubmitting(false)
    }
  }

  const handleConfirmRejectBooking = async () => {
    if (!rejectingBooking) return
    setRejectSubmitting(true)
    setError("")
    try {
      await managerApi.action(rejectingBooking.id, "reject")
      setSuccessBanner(t("staff", "msgMarkedReject"))
      recordActivity(
        "booking",
        `Reservation rejected — ${rejectingBooking.bookingRef ?? rejectingBooking.id.slice(-8)}`,
      )
      setRejectingBooking(null)
      setRejectReason("")
      await refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("staff", "errUpdateReservation"),
      )
    } finally {
      setRejectSubmitting(false)
    }
  }

  const handleTimeAdjustmentSubmit = async () => {
    if (!timeAdjustBooking) return
    setTimeAdjustSubmitting(true)
    setError("")
    try {
      if (timeAdjustBooking.type === "EARLY_IN") {
        await managerApi.earlyCheckIn(timeAdjustBooking.booking.id, {
          actualCheckIn: new Date().toISOString(),
          fee: timeAdjustFee,
          reason: timeAdjustReason,
        })
      } else {
        await managerApi.lateCheckOut(timeAdjustBooking.booking.id, {
          actualCheckOut: new Date().toISOString(),
          fee: timeAdjustFee,
          reason: timeAdjustReason,
        })
      }
      setSuccessBanner(
        `Stay adjusted successfully (${
          timeAdjustBooking.type === "EARLY_IN"
            ? "Early Check-in"
            : "Late Check-out"
        }).`,
      )
      recordActivity(
        "booking",
        `${
          timeAdjustBooking.type === "EARLY_IN"
            ? "Early check-in"
            : "Late checkout"
        } applied`,
      )
      setTimeAdjustBooking(null)
      setTimeAdjustFee(0)
      setTimeAdjustReason("")
      await refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to adjust stay timing.",
      )
    } finally {
      setTimeAdjustSubmitting(false)
    }
  }

  const handleSendThreadReply = async () => {
    if (!activeThread || !threadReply.trim()) return
    setThreadSubmitting(true)
    try {
      await contactApi.sendMessage(activeThread.id, threadReply.trim())
      setThreadReply("")
      const updated = await contactApi.getThread(activeThread.id)
      setActiveThread(updated)
      if (selectedHotelId) {
        const list = await contactApi.listThreads(selectedHotelId)
        setContactThreads(list)
      }
      recordActivity(
        "message",
        `Replied to ${activeThread.user?.fullName || "guest"}`,
      )
      setSuccessBanner("Reply sent to guest.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.")
    } finally {
      setThreadSubmitting(false)
    }
  }

  const handleResolveThread = async (threadId: string) => {
    try {
      await contactApi.updateStatus(threadId, "CLOSED")
      setSuccessBanner("Thread marked as resolved.")
      recordActivity("message", "Conversation marked as resolved")
      if (selectedHotelId) {
        const list = await contactApi.listThreads(selectedHotelId)
        setContactThreads(list)
      }
      if (activeThread?.id === threadId)
        setActiveThread((prev) => (prev ? { ...prev, status: "CLOSED" } : null))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update thread.")
    }
  }

  const handleAiAsk = (queryText: string) => {
    const q = queryText.trim()
    if (!q) return
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
    setAiMessages((prev) => [...prev, { role: "user", text: q, time: now }])
    setAiQuery("")
    setAiLoading(true)

    setTimeout(() => {
      const lower = q.toLowerCase()
      const property =
        hotels.find((hotel) => hotel.id === selectedHotelId)?.name ||
        "this property"
      const m = ops.metrics
      let reply = ""

      if (
        lower.includes("admin") ||
        lower.includes("staff management") ||
        lower.includes("password") ||
        lower.includes("salary") ||
        lower.includes("refund") ||
        lower.includes("delete hotel") ||
        lower.includes("change price")
      ) {
        reply = t("staff", "aiAssistantForbidden")
      } else if (lower.includes("prepare") && lower.includes("shift")) {
        reply = [
          `Shift brief for ${property}:`,
          `${m.arrivals} arrivals · ${m.departures} departures`,
          `${m.readyRooms} ready rooms · ${m.cleaningRooms} cleaning · ${m.maintenanceRooms} maintenance`,
          `${m.openTasks} open tasks · ${ops.attention.filter((a) => a.level === "urgent").length} urgent items`,
          "",
          `Priority: ${ops.attention[0]?.title ?? "nothing pending"}`,
        ].join("\n")
      } else if (
        lower.includes("arrival") ||
        lower.includes("check-in") ||
        lower.includes("checking in")
      ) {
        reply = `You have ${m.arrivals} arrivals at ${property}. ${stats.pendingApprovals} reservations still await confirmation.`
      } else if (
        lower.includes("available") ||
        lower.includes("free room") ||
        lower.includes("vacant") ||
        lower.includes("ready")
      ) {
        const ready = operationalRooms.filter(
          (room) => room.status === "AVAILABLE" && !room.isOccupied,
        )
        reply = ready.length
          ? `${ready.length} rooms are ready: ${ready
              .slice(0, 6)
              .map((room) => room.roomNumber)
              .join(", ")}${
              ready.length > 6 ? ` and ${ready.length - 6} more.` : "."
            }`
          : "No vacant ready rooms in active inventory right now."
      } else if (
        lower.includes("cleaning") ||
        lower.includes("housekeeping") ||
        lower.includes("dirty")
      ) {
        const cleaning = operationalRooms.filter(
          (room) => room.status === "CLEANING",
        )
        reply = `${cleaning.length} rooms are in the housekeeping queue: ${cleaning.map((room) => room.roomNumber).join(", ") || "none"}.`
      } else if (
        lower.includes("maintenance") ||
        lower.includes("repair") ||
        lower.includes("broken")
      ) {
        const maint = operationalRooms.filter(
          (room) => room.status === "MAINTENANCE",
        )
        reply = `${maint.length} rooms are flagged for maintenance: ${maint.map((room) => room.roomNumber).join(", ") || "none"}.`
      } else if (
        lower.includes("departure") ||
        lower.includes("check-out") ||
        lower.includes("checkout")
      ) {
        reply = `${m.departures} departures today. ${stats.activeGuests} guests are in house.`
      } else if (lower.includes("task") || lower.includes("open")) {
        reply = `${m.openTasks} tasks are open. Urgent: ${ops.tasks.filter((task) => task.priority === "URGENT" && task.status !== "COMPLETED").length}.`
      } else if (
        lower.includes("stay request") ||
        lower.includes("early") ||
        lower.includes("late")
      ) {
        reply = `${stayRequests.filter((request) => request.status === "PENDING").length} guest stay requests await a decision.`
      } else if (lower.includes("handover") || lower.includes("hand over")) {
        reply = shift.handover
          ? `Recorded handover: ${shift.handover}`
          : "No handover recorded yet. Open the Shift screen to capture outstanding items before you leave."
      } else {
        reply = [
          `Good day. Here is ${property}:`,
          `${m.arrivals} arrivals · ${m.departures} departures`,
          `${m.cleaningRooms} rooms waiting for cleaning · ${m.maintenanceRooms} maintenance issues`,
          `${m.openTasks} open tasks · ${ops.attention.length} items need attention`,
          "",
          ops.attention[0]
            ? `Priority: ${ops.attention[0].title}`
            : "Nothing urgent outstanding.",
        ].join("\n")
      }

      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: reply,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ])
      setAiLoading(false)
    }, 450)
  }

  const searchTerm = globalSearch.trim().toLowerCase()

  const filteredBookings = useMemo(() => {
    if (!searchTerm) return bookings
    return bookings.filter((booking) => {
      const roomText =
        booking.details
          ?.map(
            (detail) =>
              `${detail.room?.roomNumber ?? ""} ${detail.room?.type ?? ""}`,
          )
          .join(" ") ?? ""
      return [
        booking.id,
        booking.bookingRef,
        booking.user?.fullName,
        booking.user?.phone,
        roomText,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(searchTerm),
      )
    })
  }, [bookings, searchTerm])

  const searchResults = useMemo(() => {
    if (!searchTerm)
      return [] as Array<{
        kind: "booking" | "room"
        id: string
        label: string
        detail: string
      }>
    const bookingResults = bookings
      .filter((booking) => filteredBookings.includes(booking))
      .slice(0, 4)
      .map((booking) => ({
        kind: "booking" as const,
        id: booking.id,
        label: booking.user?.fullName || t("staff", "walkInGuestFallback"),
        detail: `${booking.bookingRef || `#${booking.id.slice(-8)}`} · ${statusLabel(booking.status)}`,
      }))
    const roomResults = operationalRooms
      .filter((room) =>
        `${room.roomNumber} ${room.type} ${room.currentGuest ?? ""}`
          .toLowerCase()
          .includes(searchTerm),
      )
      .slice(0, 4)
      .map((room) => ({
        kind: "room" as const,
        id: room.id,
        label: t("staff", "roomNumberLabel", { number: room.roomNumber }),
        detail: `${roomTypeLabel(room.type)} · ${statusLabel(room.status)}`,
      }))
    return [...bookingResults, ...roomResults].slice(0, 6)
  }, [
    bookings,
    filteredBookings,
    operationalRooms,
    searchTerm,
    statusLabel,
    roomTypeLabel,
    t,
  ])

  const guestProfiles = useMemo(
    () =>
      mergeGuestProfiles(
        bookings,
        guestNotes,
        t("staff", "walkInGuestFallback"),
      ),
    [bookings, guestNotes, t],
  )

  const filteredGuestProfiles = useMemo(() => {
    return guestProfiles.filter((guest) => {
      if (guestFilterStatus === "IN_HOUSE" && !guest.currentRoom) return false
      if (guestFilterStatus === "PAST" && guest.currentRoom) return false
      if (guestSearchQuery.trim()) {
        const query = guestSearchQuery.toLowerCase()
        return [
          guest.name,
          guest.email,
          guest.phone,
          guest.currentRoom,
          guest.notes,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query),
        )
      }
      return true
    })
  }, [guestProfiles, guestFilterStatus, guestSearchQuery])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const markNotificationRead = (notification: Notification) => {
    if (notification.readAt) return
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, readAt: new Date().toISOString() }
          : item,
      ),
    )
    setUnreadNotifications((current) => Math.max(0, current - 1))
    notificationApi.markRead(notification.id).catch(() => undefined)
  }

  const markAllNotificationsRead = () => {
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    )
    setUnreadNotifications(0)
    notificationApi.markAllRead().catch(() => undefined)
  }

  const walkInRoom = availableRooms.find(
    (room) => room.id === walkInForm.roomId,
  )
  const walkInNights = Math.max(
    1,
    Math.ceil(
      (new Date(walkInForm.checkOut).getTime() -
        new Date(walkInForm.checkIn).getTime()) /
        (1000 * 3600 * 24),
    ) || 1,
  )
  const walkInEstimatedTotal = Number(walkInRoom?.basePrice || 0) * walkInNights

  const setTab = (section: StaffSectionId) => {
    setTabState(section)
    setError("")
    setSuccessBanner("")
  }

  const openSection = (section: StaffSectionId) => {
    setTab(section)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return {
    router,
    user,
    language,
    setLanguage,
    t,
    logout: handleLogout,
    isDark,
    toggleStaffTheme,
    profileOpen,
    setProfileOpen,
    notificationsOpen,
    setNotificationsOpen,
    mobileNavOpen,
    setMobileNavOpen,
    globalSearch,
    setGlobalSearch,
    tab,
    setTab,
    openSection,
    loading,
    error,
    setError,
    successBanner,
    setSuccessBanner,
    acting,
    refresh,
    hotels,
    hotelPulse,
    selectedHotelId,
    setSelectedHotelId,
    selectedHotel:
      hotels.find((hotel) => hotel.id === selectedHotelId) || hotels[0],
    roomsByHotel,
    operationalRooms,
    roomsLoading,
    availableRooms,
    bookings,
    allBookings: bookingsRaw,
    stats,
    stayRequests,
    contactThreads,
    notifications,
    unreadNotifications,
    capabilities,
    ops,
    statusLabel,
    roomTypeLabel,
    taskOverrides,
    setTaskStatus,
    reassignTask,
    addTaskNote,
    recordActivity,
    localActivity,
    acknowledgedAlerts,
    acknowledgeAlert,
    snoozeAlert,
    shift,
    startShift,
    endShift,
    updateHandover,
    statusFilter,
    setStatusFilter,
    roomSearchQuery,
    setRoomSearchQuery,
    bookingStatusFilter,
    setBookingStatusFilter,
    bookingDateFilter,
    setBookingDateFilter,
    bookingRoomFilter,
    setBookingRoomFilter,
    bookingSearchQuery,
    setBookingSearchQuery,
    paymentStatusFilter,
    setPaymentStatusFilter,
    guestViewMode,
    setGuestViewMode,
    guestSearchQuery,
    setGuestSearchQuery,
    guestFilterStatus,
    setGuestFilterStatus,
    guestProfiles,
    filteredGuestProfiles,
    filteredBookings,
    searchResults,
    updateRoomStatus: handleUpdateRoomStatus,
    handleUpdateRoomStatus,
    updatingRoomId,
    act,
    markCashPaid,
    openNoShowModal,
    noShowModalBooking,
    setNoShowModalBooking,
    noShowSubmitting,
    confirmNoShow,
    rejectingBooking,
    setRejectingBooking,
    rejectReason,
    setRejectReason,
    rejectSubmitting,
    handleConfirmRejectBooking,
    relocateBooking,
    setRelocateBooking,
    relocateNewRoomId,
    setRelocateNewRoomId,
    relocateReason,
    setRelocateReason,
    relocateSubmitting,
    handleRelocateSubmit,
    timeAdjustBooking,
    setTimeAdjustBooking,
    timeAdjustFee,
    setTimeAdjustFee,
    timeAdjustReason,
    setTimeAdjustReason,
    timeAdjustSubmitting,
    handleTimeAdjustmentSubmit,
    decidingRequest,
    setDecidingRequest,
    decisionNote,
    setDecisionNote,
    decidingSubmitting,
    handleDecideStayRequest,
    walkInModalOpen,
    setWalkInModalOpen,
    walkInStep,
    setWalkInStep,
    walkInSubmitting,
    walkInForm,
    setWalkInForm,
    handleWalkInSubmit,
    walkInRoom,
    walkInNights,
    walkInEstimatedTotal,
    activeThread,
    setActiveThread,
    threadReply,
    setThreadReply,
    threadSubmitting,
    handleSendThreadReply,
    handleResolveThread,
    aiAssistantOpen,
    setAiAssistantOpen,
    aiQuery,
    setAiQuery,
    aiMessages,
    aiLoading,
    handleAiAsk,
    guestNotes,
    setGuestNotes,
    activeGuestNoteId,
    setActiveGuestNoteId,
    activeGuestNoteText,
    setActiveGuestNoteText,
    markNotificationRead,
    markAllNotificationsRead,
    handleLogout,
  }
}
