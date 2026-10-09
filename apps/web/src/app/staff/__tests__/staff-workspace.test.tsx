import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import StaffPage from "@/app/staff/page"
import { useAuth } from "@/lib/auth-store"
import { managerApi, notificationApi, paymentApi } from "@/lib/services"
import type { User } from "@/lib/types"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/staff",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "x" }),
}))

jest.mock("@/lib/services", () => {
  const actual = jest.requireActual("@/lib/services")
  return {
    ...actual,
    managerApi: {
      ...actual.managerApi,
      bookings: jest.fn(),
      stats: jest.fn(),
      hotels: jest.fn(),
      getOperationalRooms: jest.fn(),
      updateRoomStatus: jest.fn(),
      action: jest.fn(),
      createWalkIn: jest.fn(),
      noShow: jest.fn(),
      listStayRequests: jest.fn(),
      decideStayRequest: jest.fn(),
      relocateRoom: jest.fn(),
      staffRoles: jest.fn(),
    },
    paymentApi: { ...actual.paymentApi, markCashPaid: jest.fn() },
    notificationApi: {
      ...actual.notificationApi,
      list: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
    },
  }
})

const mgr = managerApi as unknown as Record<string, jest.Mock>
const notes = notificationApi as unknown as Record<string, jest.Mock>

const staffUser: User = {
  id: "u-staff",
  email: "sam@luxstay.test",
  fullName: "Sam Tesfaye",
  role: "STAFF",
  isActive: true,
  createdAt: "2026-01-05T00:00:00.000Z",
}

const operationalRoom = (
  id: string,
  roomNumber: string,
  status: string,
  isOccupied = false,
) => ({
  id,
  roomNumber,
  type: "DELUXE",
  capacity: 2,
  beds: 1,
  bathroom: 1,
  basePrice: 3500,
  status,
  amenities: [],
  hotelId: "h1",
  isOccupied,
  currentGuest: isOccupied ? "Girma Wolde" : null,
  currentGuestPhone: null,
  currentBookingId: null,
  currentBookingRef: null,
  checkInDate: null,
  checkOutDate: null,
})

const ROOMS = [
  operationalRoom("r101", "101", "AVAILABLE"),
  operationalRoom("r102", "102", "CLEANING"),
  operationalRoom("r103", "103", "MAINTENANCE"),
  operationalRoom("r104", "104", "AVAILABLE", true),
]

const hotel = {
  id: "h1",
  name: "Skylight Hotel",
  description: "A central business hotel",
  address: "Bole Road, Addis Ababa",
  city: { id: "c1", name: "Addis Ababa", country: { name: "Ethiopia" } },
  starRating: 5,
  averageRating: 4.7,
  reviewCount: 210,
  status: "ACTIVE",
  lat: null,
  lng: null,
  images: [],
  amenities: [],
  rooms: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

const notification = {
  id: "ntf-1",
  userId: "u-staff",
  type: "ROOM_READY",
  channel: "IN_APP",
  payload: {
    title: "Room 104 is ready for arrival",
    message: "Housekeeping marked 104 as ready.",
  },
  readAt: null,
  createdAt: new Date().toISOString(),
}

const sidebar = () => within(screen.getAllByRole("complementary")[0])

const navMatch = (label: string) => new RegExp(`^${label}`)

const openSection = async (label: string) => {
  await waitFor(() =>
    expect(
      sidebar().getByRole("button", { name: navMatch(label) }),
    ).toBeInTheDocument(),
  )
  await userEvent
    .setup()
    .click(sidebar().getByRole("button", { name: navMatch(label) }))
}

beforeEach(() => {
  localStorage.clear()
  jest.clearAllMocks()
  useAuth.setState({
    user: null,
    tokens: null,
    loading: false,
    isInitialized: false,
    isAdmin: false,
    isManager: false,
    isStaff: false,
    isCustomer: false,
  })

  mgr.bookings.mockResolvedValue({ data: [] })
  mgr.stats.mockResolvedValue({
    pendingApprovals: 0,
    todaysCheckIns: 0,
    todaysCheckOuts: 0,
    activeGuests: 0,
  })
  mgr.hotels.mockResolvedValue([hotel])
  mgr.getOperationalRooms.mockResolvedValue(ROOMS)
  mgr.listStayRequests.mockResolvedValue([])
  mgr.updateRoomStatus.mockResolvedValue(undefined)
  mgr.action.mockResolvedValue(undefined)
  mgr.createWalkIn.mockResolvedValue(undefined)
  mgr.noShow.mockResolvedValue(undefined)
  mgr.decideStayRequest.mockResolvedValue(undefined)
  mgr.relocateRoom.mockResolvedValue(undefined)
  mgr.staffRoles.mockRejectedValue(new Error("forbidden"))
  notes.list.mockResolvedValue({
    data: [notification],
    meta: { total: 1, page: 1, pageSize: 20, pageCount: 1 },
    unreadCount: 1,
  })
  notes.markRead.mockResolvedValue(undefined)
  notes.markAllRead.mockResolvedValue(undefined)

  useAuth
    .getState()
    .setSession({ user: staffUser, accessToken: "at", refreshToken: "rt" })
})

const NAV_LABELS = [
  "Operations",
  "My Tasks",
  "Reservations",
  "Room Board",
  "Housekeeping",
  "Guest Profiles",
  "Stay Requests",
  "Payments",
  "Inbox",
  "Maintenance",
  "Activity",
  "Shift & Handover",
  "AI Ops Copilot",
  "Notifications",
  "Profile",
]

describe("Staff workspace navigation", () => {
  it("renders the grouped operations navigation and property switcher", async () => {
    render(<StaffPage />)
    await screen.findByRole("heading", { name: "Front Desk Console" })

    for (const label of NAV_LABELS) {
      expect(
        sidebar().getAllByRole("button", { name: navMatch(label) }).length,
      ).toBeGreaterThan(0)
    }

    expect(
      screen.getByRole("button", {
        name: "Switch property, currently Skylight Hotel",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Needs Attention" }),
    ).toBeInTheDocument()
  }, 15000)

  it("shows the room lifecycle strip on the room board", async () => {
    render(<StaffPage />)
    await openSection("Room Board")

    expect(await screen.findByText("Room lifecycle")).toBeInTheDocument()
    expect(screen.getByText("Maintenance branch")).toBeInTheDocument()
    expect(
      await screen.findByText("Housekeeping & Room Status"),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole("button", { name: "Check-out: 0" }),
    ).toBeInTheDocument()
  }, 15000)

  it("renders every navigation section without crashing", async () => {
    render(<StaffPage />)
    await screen.findByRole("heading", { name: "Front Desk Console" })

    for (const label of NAV_LABELS) {
      await openSection(label)
      await waitFor(() =>
        expect(
          screen.getAllByRole("heading", { name: navMatch(label) }).length,
        ).toBeGreaterThan(0),
      )
    }
  }, 30000)

  it("opens the walk-in section from the mobile quick actions menu", async () => {
    const user = userEvent.setup()
    render(<StaffPage />)
    await screen.findByRole("heading", { name: "Front Desk Console" })

    await user.click(screen.getByRole("button", { name: "Quick actions" }))
    const menu = document.querySelector("div.z-\\[55\\]") as HTMLElement
    await user.click(within(menu).getByRole("button", { name: "Walk-in" }))

    expect(
      await screen.findByText("Fast Front-Desk Walk-In Check-In"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Speed-optimized 6-step front-desk guest registration."),
    ).toBeInTheDocument()
  }, 15000)
})

describe("Staff tasks board", () => {
  it("completes a task and stores the override locally", async () => {
    const user = userEvent.setup()
    render(<StaffPage />)
    await openSection("My Tasks")

    expect(
      await screen.findByText(
        "Everything assigned to you, grouped by priority.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("Clean room 102")).toBeInTheDocument()
    expect(screen.getByText("Restore room 103")).toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "Complete" })[0])

    await waitFor(() => {
      const stored = JSON.parse(
        localStorage.getItem("luxstay-staff-task-overrides") ?? "{}",
      )
      expect(Object.values(stored)).toEqual([
        expect.objectContaining({ status: "COMPLETED" }),
      ])
    })
    expect(
      await screen.findByRole("button", { name: "Reopen" }),
    ).toBeInTheDocument()
  }, 15000)
})

describe("Staff housekeeping workspace", () => {
  it("releases a cleaning room from the turnover lanes", async () => {
    const user = userEvent.setup()
    render(<StaffPage />)
    await openSection("Housekeeping")

    expect(
      await screen.findByText("Housekeeping Workspace"),
    ).toBeInTheDocument()
    expect(screen.getByText("Cleaning")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Complete" }))

    await waitFor(() =>
      expect(mgr.updateRoomStatus).toHaveBeenCalledWith("r102", "AVAILABLE"),
    )
    expect(
      await screen.findByText("Room status successfully updated to Available."),
    ).toBeInTheDocument()
  }, 15000)
})

describe("Staff maintenance queue", () => {
  it("returns a maintenance room to inventory and logs it", async () => {
    const user = userEvent.setup()
    render(<StaffPage />)
    await openSection("Maintenance")

    expect(
      await screen.findByText("Open issues, repairs and room history."),
    ).toBeInTheDocument()
    expect(screen.getByText("Room 103")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Complete repair" }))
    await waitFor(() =>
      expect(mgr.updateRoomStatus).toHaveBeenCalledWith("r103", "AVAILABLE"),
    )

    await openSection("Activity")
    expect(await screen.findByText("Activity Log")).toBeInTheDocument()
    expect(
      await screen.findByText(/Room 103 set to Available/),
    ).toBeInTheDocument()
  }, 15000)
})

describe("Staff shift & handover", () => {
  it("starts a shift and saves the handover note on this device", async () => {
    const user = userEvent.setup()
    render(<StaffPage />)
    await openSection("Shift & Handover")

    expect(
      await screen.findByText(
        "Open your shift, capture handover and close out cash.",
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Start shift" }))

    await waitFor(() => {
      const stored = JSON.parse(
        localStorage.getItem("luxstay-staff-shift") ?? "{}",
      )
      expect(stored.startedAt).toBeTruthy()
      expect(stored.endedAt).toBeNull()
    })

    await user.type(
      screen.getByPlaceholderText("What should the next shift know?"),
      "VIP arriving at 14:00",
    )
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      const stored = JSON.parse(
        localStorage.getItem("luxstay-staff-shift") ?? "{}",
      )
      expect(stored.handover).toBe("VIP arriving at 14:00")
    })
  }, 15000)
})

describe("Staff AI ops copilot", () => {
  it("answers an operations question from live metrics", async () => {
    const user = userEvent.setup()
    render(<StaffPage />)
    await openSection("AI Ops Copilot")

    expect(
      await screen.findByText(
        "Ask about arrivals, rooms, tasks and shift priorities.",
      ),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "How many arrivals today?" }),
    )

    expect(
      await screen.findByText(/arrivals at Skylight Hotel/, {}, {
        timeout: 4000,
      }),
    ).toBeInTheDocument()
  }, 15000)

  it("refuses restricted administrative topics", async () => {
    const user = userEvent.setup()
    render(<StaffPage />)
    await openSection("AI Ops Copilot")

    await screen.findByText(
      "Ask about arrivals, rooms, tasks and shift priorities.",
    )
    await user.type(
      screen.getByPlaceholderText("Ask about arrivals, rooms, tasks…"),
      "reset my password",
    )
    await user.click(screen.getByRole("button", { name: "Send question" }))

    expect(
      await screen.findByText(
        /Administrative, staffing, and multi-hotel configuration data is restricted/,
        {},
        { timeout: 4000 },
      ),
    ).toBeInTheDocument()
  }, 15000)
})

describe("Staff notification center", () => {
  it("lists unread alerts and marks them all as read", async () => {
    const user = userEvent.setup()
    render(<StaffPage />)
    await openSection("Notifications")

    expect(await screen.findByText("Notification Center")).toBeInTheDocument()
    expect(
      screen.getByText("Room 104 is ready for arrival"),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Mark all read" }))

    await waitFor(() => expect(notes.markAllRead).toHaveBeenCalled())
    await user.click(screen.getByRole("button", { name: "Unread" }))
    expect(
      await screen.findByText("No unread notifications"),
    ).toBeInTheDocument()
  }, 15000)
})

describe("Staff profile", () => {
  it("shows granted capabilities and the restricted set", async () => {
    render(<StaffPage />)
    await openSection("Profile")

    expect(await screen.findByText("Visible capabilities")).toBeInTheDocument()
    expect(screen.getByText("booking.checkin")).toBeInTheDocument()
    expect(screen.getByText("coupon.create")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Permissions are enforced by the API. Hiding a control here never grants access.",
      ),
    ).toBeInTheDocument()
  }, 15000)
})
