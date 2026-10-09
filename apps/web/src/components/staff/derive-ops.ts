import type {
  ContactThread,
  Notification,
  OperationalRoom,
  StayRequest,
} from "@/lib/types"
import type {
  ActivityEvent,
  AttentionItem,
  GuestProfile,
  StaffBooking,
  StaffTask,
} from "./types"

export interface TaskOverrides {
  status?: StaffTask["status"]
  assignedTo?: string
  dueAt?: string
  note?: string
}

export interface OpsInput {
  hotelId: string
  hotelName: string
  bookings: StaffBooking[]
  rooms: OperationalRoom[]
  stayRequests: StayRequest[]
  threads: ContactThread[]
  notifications: Notification[]
  taskOverrides?: Record<string, TaskOverrides>
  localActivity?: ActivityEvent[]
}

export interface HotelPulse {
  hotelId: string
  hotelName: string
  occupancyPct: number
  arrivals: number
  departures: number
  openTasks: number
  maintenance: number
  totalRooms: number
}

export interface OpsSnapshot {
  metrics: {
    occupancy: number
    occupancyPct: number
    arrivals: number
    departures: number
    activeGuests: number
    readyRooms: number
    cleaningRooms: number
    maintenanceRooms: number
    openTasks: number
  }
  attention: AttentionItem[]
  tasks: StaffTask[]
  activity: ActivityEvent[]
  alerts: AttentionItem[]
}

const localDate = (value: string | Date | null | undefined): string => {
  if (!value) return ""
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ""
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, "0")
  const d = `${date.getDate()}`.padStart(2, "0")
  return `${y}-${m}-${d}`
}

export const isToday = (value: string | null | undefined): boolean =>
  Boolean(value) && localDate(value) === localDate(new Date())

const isPastDate = (value: string | null | undefined): boolean => {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return localDate(date) < localDate(new Date())
}

const guestName = (booking: StaffBooking, fallback: string) =>
  booking.user?.fullName || booking.details?.[0]?.guestInfo?.name || fallback

const roomLabel = (booking: StaffBooking) =>
  booking.details?.[0]?.room?.roomNumber || ""

export function buildTasks(input: OpsInput): StaffTask[] {
  const tasks: StaffTask[] = []
  const overrides = input.taskOverrides ?? {}
  const walkInFallback = "Walk-in guest"

  for (const booking of input.bookings) {
    const room = roomLabel(booking)
    const name = guestName(booking, walkInFallback)
    const id = `checkin:${booking.id}`

    if (booking.status === "PENDING" || booking.status === "CONFIRMED") {
      const arrivingToday = isToday(booking.checkIn)
      const overdue = isPastDate(booking.checkIn)
      tasks.push({
        id,
        title:
          arrivingToday || overdue
            ? `Check in ${name}`
            : `Prepare arrival for ${name}`,
        detail: `${booking.bookingRef || `#${booking.id.slice(-8)}`} · arrives ${booking.checkIn.slice(0, 10)}`,
        priority: overdue || arrivingToday ? "URGENT" : "TODAY",
        type: "CHECK_IN",
        room,
        guest: name,
        bookingId: booking.id,
        createdAt: booking.createdAt,
        dueAt: booking.checkIn,
        assignedTo: "Front desk",
        status: "OPEN",
      })
    }

    if (booking.status === "CHECKED_IN") {
      const leavingToday = isToday(booking.checkOut)
      tasks.push({
        id: `checkout:${booking.id}`,
        title: leavingToday
          ? `Check out ${name}`
          : `Host ${name} in ${room ? `room ${room}` : "house"}`,
        detail: leavingToday
          ? `Departure due ${booking.checkOut.slice(0, 10)}`
          : `Stay until ${booking.checkOut.slice(0, 10)}`,
        priority: leavingToday ? "URGENT" : "TODAY",
        type: leavingToday ? "DEPARTURE" : "GUEST_REQUEST",
        room,
        guest: name,
        bookingId: booking.id,
        createdAt: booking.createdAt,
        dueAt: booking.checkOut,
        assignedTo: "Front desk",
        status: "OPEN",
      })
    }

    const paymentPending =
      booking.payment &&
      booking.payment.status !== "SUCCEEDED" &&
      booking.status === "CHECKED_IN"
    if (paymentPending) {
      tasks.push({
        id: `payment:${booking.id}`,
        title: `Collect payment from ${name}`,
        detail: `${booking.bookingRef || `#${booking.id.slice(-8)}`} balance outstanding`,
        priority: "TODAY",
        type: "PAYMENT",
        room,
        guest: name,
        bookingId: booking.id,
        createdAt: booking.createdAt,
        assignedTo: "Cashier",
        status: "OPEN",
      })
    }
  }

  for (const room of input.rooms) {
    if (room.status === "CLEANING") {
      tasks.push({
        id: `clean:${room.id}`,
        title: `Clean room ${room.roomNumber}`,
        detail: room.currentGuest
          ? `Turnover after ${room.currentGuest}`
          : "Scheduled housekeeping round",
        priority: "TODAY",
        type: "HOUSEKEEPING",
        room: room.roomNumber,
        guest: room.currentGuest ?? undefined,
        createdAt: room.checkOutDate ?? new Date().toISOString(),
        assignedTo: "Housekeeping",
        status: "OPEN",
      })
    }
    if (room.status === "MAINTENANCE") {
      tasks.push({
        id: `maint:${room.id}`,
        title: `Restore room ${room.roomNumber}`,
        detail: "Room flagged for repair — inspection required before release",
        priority: "URGENT",
        type: "MAINTENANCE",
        room: room.roomNumber,
        createdAt: new Date().toISOString(),
        assignedTo: "Maintenance",
        status: "OPEN",
      })
    }
    if (room.status === "UNAVAILABLE") {
      tasks.push({
        id: `inspect:${room.id}`,
        title: `Inspect room ${room.roomNumber}`,
        detail:
          "Out of service — confirm readiness before returning to inventory",
        priority: "UPCOMING",
        type: "INSPECTION",
        room: room.roomNumber,
        createdAt: new Date().toISOString(),
        assignedTo: "Housekeeping",
        status: "OPEN",
      })
    }
  }

  for (const request of input.stayRequests) {
    if (request.status !== "PENDING") continue
    const booking = input.bookings.find((item) => item.id === request.bookingId)
    tasks.push({
      id: `request:${request.id}`,
      title:
        request.type === "EARLY_CHECK_IN"
          ? "Review early check-in request"
          : "Review late checkout request",
      detail: booking
        ? `${guestName(booking, walkInFallback)} · ${roomLabel(booking) || "room pending"}`
        : "Guest request awaiting decision",
      priority: "TODAY",
      type: "GUEST_REQUEST",
      room: roomLabel(booking ?? {} as StaffBooking) || undefined,
      guest: booking ? guestName(booking, walkInFallback) : undefined,
      bookingId: request.bookingId,
      createdAt: request.createdAt,
      assignedTo: "Front desk",
      status: "OPEN",
    })
  }

  for (const thread of input.threads) {
    if (thread.status === "CLOSED") continue
    tasks.push({
      id: `thread:${thread.id}`,
      title: `Reply to ${thread.user?.fullName || "guest"}`,
      detail: thread.subject || "Open guest conversation",
      priority: "TODAY",
      type: "GUEST_REQUEST",
      guest: thread.user?.fullName ?? undefined,
      createdAt: thread.updatedAt || thread.createdAt,
      assignedTo: "Concierge",
      status: "OPEN",
    })
  }

  return tasks
    .map((task) => {
      const override = overrides[task.id]
      if (!override) return task
      return {
        ...task,
        status: override.status ?? task.status,
        assignedTo: override.assignedTo ?? task.assignedTo,
        dueAt: override.dueAt ?? task.dueAt,
      }
    })
    .sort((a, b) => {
      const rank = { URGENT: 0, TODAY: 1, UPCOMING: 2 } as const
      if (a.status === "COMPLETED" && b.status !== "COMPLETED") return 1
      if (b.status === "COMPLETED" && a.status !== "COMPLETED") return -1
      if (rank[a.priority] !== rank[b.priority])
        return rank[a.priority] - rank[b.priority]
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
}

export function buildAttention(
  input: OpsInput,
  tasks: StaffTask[],
): AttentionItem[] {
  const items: AttentionItem[] = []
  const walkInFallback = "Walk-in guest"

  for (const booking of input.bookings) {
    if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") continue
    const waiting = isToday(booking.checkIn) || isPastDate(booking.checkIn)
    if (!waiting) continue
    items.push({
      id: `arr:${booking.id}`,
      level: isPastDate(booking.checkIn) ? "urgent" : "attention",
      title: "Guest waiting for check-in",
      detail: `${guestName(booking, walkInFallback)}${
        roomLabel(booking) ? ` · Room ${roomLabel(booking)}` : ""
      } · ${booking.bookingRef || `#${booking.id.slice(-8)}`}`,
      actionLabel: "Check In",
      action: { section: "reservations", bookingId: booking.id },
    })
  }

  for (const room of input.rooms) {
    if (room.status === "MAINTENANCE") {
      items.push({
        id: `maint:${room.id}`,
        level: "attention",
        title: `Room ${room.roomNumber} maintenance open`,
        detail: "Repair not yet released to inventory",
        actionLabel: "Resolve",
        action: { section: "maintenance", roomId: room.id },
      })
    }
    if (room.status === "CLEANING") {
      items.push({
        id: `clean:${room.id}`,
        level: "reminder",
        title: `Room ${room.roomNumber} waiting for housekeeping`,
        detail: room.currentGuest
          ? `Turnover after ${room.currentGuest}`
          : "Cleaning queue",
        actionLabel: "Assign",
        action: { section: "housekeeping", roomId: room.id },
      })
    }
    if (room.status === "UNAVAILABLE") {
      items.push({
        id: `inspect:${room.id}`,
        level: "info",
        title: `Room ${room.roomNumber} out of service`,
        detail: "Inspection required before release",
        actionLabel: "Review",
        action: { section: "rooms", roomId: room.id },
      })
    }
  }

  for (const request of input.stayRequests) {
    if (request.status !== "PENDING") continue
    const booking = input.bookings.find((item) => item.id === request.bookingId)
    items.push({
      id: `sr:${request.id}`,
      level: "reminder",
      title:
        request.type === "EARLY_CHECK_IN"
          ? "Early check-in requested"
          : "Late checkout request",
      detail: booking
        ? `${guestName(booking, walkInFallback)} · ${roomLabel(booking) || "room pending"}`
        : "Awaiting front desk decision",
      actionLabel: "Review",
      action: { section: "stay-requests", requestId: request.id },
    })
  }

  const pendingApprovals = input.bookings.filter(
    (booking) => booking.status === "PENDING",
  )
  for (const booking of pendingApprovals.slice(0, 3)) {
    items.push({
      id: `pending:${booking.id}`,
      level: "attention",
      title: "Reservation awaiting confirmation",
      detail: `${guestName(booking, walkInFallback)} · ${booking.bookingRef || `#${booking.id.slice(-8)}`}`,
      actionLabel: "Review",
      action: { section: "reservations", bookingId: booking.id },
    })
  }

  const openThreads = input.threads.filter(
    (thread) => thread.status !== "CLOSED",
  )
  if (openThreads.length > 0) {
    items.push({
      id: "inbox-open",
      level: "info",
      title: `${openThreads.length} open guest message${
        openThreads.length === 1 ? "" : "s"
      }`,
      detail: openThreads[0]?.subject || "Guest communication needs a reply",
      actionLabel: "Open",
      action: { section: "inbox" },
    })
  }

  const levelRank = { urgent: 0, attention: 1, reminder: 2, info: 3 } as const
  return items
    .sort((a, b) => levelRank[a.level] - levelRank[b.level])
    .slice(0, 12)
}

export function buildActivity(
  input: OpsInput,
  overrides: Record<string, TaskOverrides> = {},
): ActivityEvent[] {
  const events: ActivityEvent[] = [...(input.localActivity ?? [])]
  const walkInFallback = "Walk-in guest"

  for (const booking of input.bookings) {
    events.push({
      id: `bk:${booking.id}`,
      at: booking.createdAt,
      actor: "Booking engine",
      text: `${guestName(booking, walkInFallback)} booked ${
        roomLabel(booking) ? `room ${roomLabel(booking)}` : "a stay"
      } (${booking.bookingRef || `#${booking.id.slice(-8)}`})`,
      kind: "booking",
    })
    if (booking.status === "CHECKED_IN") {
      events.push({
        id: `bkci:${booking.id}`,
        at: booking.checkIn,
        actor: "Front desk",
        text: `${guestName(booking, walkInFallback)} checked in${
          roomLabel(booking) ? ` to room ${roomLabel(booking)}` : ""
        }`,
        kind: "checkin",
      })
    }
    if (booking.status === "CHECKED_OUT") {
      events.push({
        id: `bkco:${booking.id}`,
        at: booking.checkOut,
        actor: "Front desk",
        text: `${guestName(booking, walkInFallback)} checked out${
          roomLabel(booking) ? ` from room ${roomLabel(booking)}` : ""
        }`,
        kind: "checkout",
      })
    }
  }

  for (const request of input.stayRequests) {
    if (request.status === "PENDING") continue
    events.push({
      id: `sr:${request.id}`,
      at: request.createdAt,
      actor: "Front desk",
      text: `${
        request.type === "EARLY_CHECK_IN" ? "Early check-in" : "Late checkout"
      } request ${request.status.toLowerCase()}`,
      kind: "request",
    })
  }

  for (const thread of input.threads) {
    events.push({
      id: `th:${thread.id}`,
      at: thread.updatedAt || thread.createdAt,
      actor: thread.user?.fullName || "Guest",
      text: `Guest message "${thread.subject || "New conversation"}"`,
      kind: "message",
    })
  }

  for (const notification of input.notifications) {
    const title =
      (typeof notification.payload?.title === "string" &&
        notification.payload.title) ||
      (typeof notification.payload?.message === "string" &&
        notification.payload.message) ||
      notification.type
    events.push({
      id: `nt:${notification.id}`,
      at: notification.createdAt,
      actor: "System",
      text: title,
      kind: "task",
    })
  }

  const seen = new Set<string>()
  return events
    .filter((event) => {
      const key = `${event.id}:${event.at}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 80)
}

export function buildOpsSnapshot(input: OpsInput): OpsSnapshot {
  const tasks = buildTasks(input)
  const attention = buildAttention(input, tasks)
  const activity = buildActivity(input, input.taskOverrides)

  const totalRooms = input.rooms.length
  const occupied = input.rooms.filter((room) => room.isOccupied).length
  const readyRooms = input.rooms.filter(
    (room) => room.status === "AVAILABLE" && !room.isOccupied,
  ).length
  const cleaningRooms = input.rooms.filter(
    (room) => room.status === "CLEANING",
  ).length
  const maintenanceRooms = input.rooms.filter(
    (room) => room.status === "MAINTENANCE",
  ).length

  const arrivals = input.bookings.filter(
    (booking) =>
      (booking.status === "CONFIRMED" || booking.status === "PENDING") &&
      (isToday(booking.checkIn) || isPastDate(booking.checkIn)),
  ).length
  const departures = input.bookings.filter(
    (booking) =>
      booking.status === "CHECKED_IN" &&
      (isToday(booking.checkOut) || isPastDate(booking.checkOut)),
  ).length
  const activeGuests =
    input.bookings.filter((booking) => booking.status === "CHECKED_IN")
      .length || input.rooms.filter((room) => room.isOccupied).length

  const openTasks = tasks.filter((task) => task.status !== "COMPLETED").length

  return {
    metrics: {
      occupancy: occupied,
      occupancyPct: totalRooms ? Math.round((occupied / totalRooms) * 100) : 0,
      arrivals,
      departures,
      activeGuests,
      readyRooms,
      cleaningRooms,
      maintenanceRooms,
      openTasks,
    },
    attention,
    tasks,
    activity,
    alerts: attention.filter((item) => item.level !== "info"),
  }
}

export function buildHotelPulse(args: {
  hotels: Array<{ id: string ;name: string }>
  roomsByHotel: Record<string, OperationalRoom[]>
  bookings: StaffBooking[]
  tasksByHotel: Record<string, StaffTask[]>
}): HotelPulse[] {
  return args.hotels.map((hotel) => {
    const rooms = args.roomsByHotel[hotel.id] ?? []
    const bookings = args.bookings.filter(
      (booking) => booking.hotelId === hotel.id,
    )
    const occupied = rooms.filter((room) => room.isOccupied).length
    return {
      hotelId: hotel.id,
      hotelName: hotel.name,
      totalRooms: rooms.length,
      occupancyPct: rooms.length
        ? Math.round((occupied / rooms.length) * 100)
        : 0,
      arrivals: bookings.filter(
        (booking) =>
          (booking.status === "CONFIRMED" || booking.status === "PENDING") &&
          (isToday(booking.checkIn) || isPastDate(booking.checkIn)),
      ).length,
      departures: bookings.filter(
        (booking) =>
          booking.status === "CHECKED_IN" &&
          (isToday(booking.checkOut) || isPastDate(booking.checkOut)),
      ).length,
      openTasks: (args.tasksByHotel[hotel.id] ?? []).length,
      maintenance: rooms.filter((room) => room.status === "MAINTENANCE").length,
    }
  })
}

export function summarizeGuestJourney(booking: StaffBooking | undefined) {
  if (!booking) return []
  const name =
    booking.user?.fullName || booking.details?.[0]?.guestInfo?.name || "Guest"
  const room = booking.details?.[0]?.room?.roomNumber
  const steps: Array<{
    key: string
    labelKey: string
    at?: string
    done: boolean
  }> = [
    {
      key: "booking",
      labelKey: "journeyBooking",
      at: booking.createdAt,
      done: true,
    },
    {
      key: "arrival",
      labelKey: "journeyArrival",
      at: booking.checkIn,
      done: booking.status !== "PENDING" && booking.status !== "CONFIRMED",
    },
    {
      key: "checkin",
      labelKey: "journeyCheckIn",
      at:
        booking.status === "CHECKED_IN" || booking.status === "CHECKED_OUT"
          ? booking.checkIn
          : undefined,
      done: booking.status === "CHECKED_IN" || booking.status === "CHECKED_OUT",
    },
    {
      key: "room",
      labelKey: "journeyRoom",
      done:
        Boolean(room) &&
        (booking.status === "CHECKED_IN" || booking.status === "CHECKED_OUT"),
    },
    { key: "requests", labelKey: "journeyRequests", done: false },
    {
      key: "payments",
      labelKey: "journeyPayments",
      done: booking.payment?.status === "SUCCEEDED",
    },
    {
      key: "checkout",
      labelKey: "journeyCheckOut",
      at: booking.status === "CHECKED_OUT" ? booking.checkOut : undefined,
      done: booking.status === "CHECKED_OUT",
    },
    { key: "feedback", labelKey: "journeyFeedback", done: false },
  ]
  return steps
}

export function mergeGuestProfiles(
  bookings: StaffBooking[],
  guestNotes: Record<string, string>,
  fallback: string,
): GuestProfile[] {
  const map = new Map<string, GuestProfile>()
  bookings.forEach((booking) => {
    const email =
      booking.user?.email || `walkin-${booking.id.slice(0, 6)}@frontdesk.local`
    const name = guestName(booking, fallback)
    const phone =
      booking.user?.phone || booking.details?.[0]?.guestInfo?.phone || "—"
    const existing = map.get(email)
    const activeRoom =
      booking.status === "CHECKED_IN"
        ? booking.details?.[0]?.room?.roomNumber
        : undefined

    if (existing) {
      existing.totalStays += 1
      existing.totalSpent += Number(booking.totalPrice || 0)
      if (activeRoom) {
        existing.currentRoom = activeRoom
        existing.currentBookingId = booking.id
      }
    } else {
      map.set(email, {
        id: booking.userId || booking.id,
        name,
        email: booking.user?.email || "—",
        phone,
        nationalId: booking.details?.[0]?.guestInfo?.nationalId,
        totalStays: 1,
        totalSpent: Number(booking.totalPrice || 0),
        lastVisit: booking.checkIn,
        currentRoom: activeRoom,
        currentBookingId: activeRoom ? booking.id : undefined,
        notes: guestNotes[email] || "",
      })
    }
  })
  return Array.from(map.values())
}
