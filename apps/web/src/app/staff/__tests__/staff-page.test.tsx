import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import StaffPage from "@/app/staff/page"
import { useAuth } from "@/lib/auth-store"
import { managerApi, paymentApi } from "@/lib/services"
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
    },
    paymentApi: { ...actual.paymentApi, markCashPaid: jest.fn() },
  }
})

const mgr = managerApi as unknown as Record<string, jest.Mock>
const pay = paymentApi as unknown as Record<string, jest.Mock>

const staffUser: User = {
  id: "u-staff",
  email: "sam@luxstay.test",
  fullName: "Sam Tesfaye",
  role: "STAFF",
  isActive: true,
  createdAt: "2026-01-05T00:00:00.000Z",
}

const customerUser: User = {
  ...staffUser,
  id: "u-cust",
  role: "CUSTOMER",
  fullName: "Hanna Girma",
}
const managerUser: User = {
  ...staffUser,
  id: "u-mgr",
  role: "MANAGER",
  fullName: "Miki Alemu",
}

const pendingBooking = {
  id: "bk-pending-00000001",
  userId: "u-guest",
  hotelId: "h1",
  checkIn: "2026-10-12T00:00:00.000Z",
  checkOut: "2026-10-14T00:00:00.000Z",
  status: "PENDING",
  totalPrice: 4200,
  createdAt: "2026-10-01T00:00:00.000Z",
  bookingRef: "LX-99312",
  user: {
    fullName: "Abebe Kebede",
    email: "abebe@example.com",
    phone: "+251911000001",
  },
}

const confirmedBooking = {
  ...pendingBooking,
  id: "bk-confirmed-00000002",
  bookingRef: "LX-99313",
  status: "CONFIRMED",
  user: { fullName: "Sara Bekele", email: "sara@example.com", phone: null },
}

const stayRequest = {
  id: "sr-1",
  bookingId: "bk-pending-00000001",
  type: "EARLY_CHECK_IN",
  requestedTime: "11:00",
  status: "PENDING",
  createdAt: "2026-10-01T00:00:00.000Z",
}

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
  rooms: [
    {
      id: "r101",
      roomNumber: "101",
      type: "DELUXE",
      capacity: 2,
      beds: 1,
      bathroom: 1,
      basePrice: 3500,
      status: "AVAILABLE",
      amenities: [],
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
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

  mgr.bookings.mockResolvedValue({ data: [pendingBooking, confirmedBooking] })
  mgr.stats.mockResolvedValue({
    pendingApprovals: 3,
    todaysCheckIns: 5,
    todaysCheckOuts: 2,
    activeGuests: 7,
  })
  mgr.hotels.mockResolvedValue([hotel])
  mgr.getOperationalRooms.mockResolvedValue([])
  mgr.listStayRequests.mockResolvedValue([stayRequest])
  mgr.action.mockResolvedValue(undefined)
  mgr.decideStayRequest.mockResolvedValue(undefined)
  mgr.createWalkIn.mockResolvedValue(undefined)
  mgr.updateRoomStatus.mockResolvedValue(undefined)
  mgr.noShow.mockResolvedValue(undefined)
  mgr.relocateRoom.mockResolvedValue(undefined)
  pay.markCashPaid.mockResolvedValue(undefined)

  useAuth
    .getState()
    .setSession({ user: staffUser, accessToken: "at", refreshToken: "rt" })
})

describe("StaffDashboardPage", () => {
  it("shows the loading portal state while the first load is pending", () => {
    mgr.bookings.mockReturnValue(new Promise(() => undefined))

    render(<StaffPage />)

    expect(screen.getByText("Loading front desk portal…")).toBeInTheDocument()
  }, 15000)

  it("renders the dashboard with front desk metrics and today’s arrivals", async () => {
    render(<StaffPage />)

    expect(
      await screen.findByRole("heading", { name: "Front Desk Console" }),
    ).toBeInTheDocument()
    expect(screen.getAllByText("Occupancy").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Arrivals").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Departures").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Active guests").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Ready rooms").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Open tasks").length).toBeGreaterThan(0)
    expect(screen.getByText("Needs Attention")).toBeInTheDocument()
    expect(screen.getByText("Today's Arrivals & Stays")).toBeInTheDocument()
    expect(screen.getByText("Abebe Kebede")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "View All (2) →" }),
    ).toBeInTheDocument()
  }, 15000)

  it("confirms a pending reservation from the arrivals board", async () => {
    const user = userEvent.setup()
    render(<StaffPage />)
    await screen.findByRole("heading", { name: "Front Desk Console" })

    await user.click(screen.getByRole("button", { name: "Confirm" }))

    await waitFor(() =>
      expect(mgr.action).toHaveBeenCalledWith("bk-pending-00000001", "confirm"),
    )
    expect(
      await screen.findByText("Reservation marked as confirmed."),
    ).toBeInTheDocument()
  }, 15000)

  it("opens the Bookings tab with per-status actions", async () => {
    const user = userEvent.setup()
    render(<StaffPage />)
    await screen.findByRole("heading", { name: "Front Desk Console" })

    await user.click(screen.getByRole("button", { name: "Bookings" }))
    expect(
      await screen.findByRole("heading", { name: "Front Desk Reservations" }),
    ).toBeInTheDocument()
    expect(screen.getByText("2 reservations recorded")).toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "Check In" })[0])

    await waitFor(() =>
      expect(mgr.action).toHaveBeenCalledWith(
        "bk-confirmed-00000002",
        "check-in",
      ),
    )
  }, 15000)

  it("records a cash payment for a reservation", async () => {
    const user = userEvent.setup()
    render(<StaffPage />)
    await screen.findByRole("heading", { name: "Front Desk Console" })

    await user.click(screen.getByRole("button", { name: "Bookings" }))
    await user.click(
      screen.getAllByRole("button", { name: "Mark Cash Paid" })[0],
    )

    await waitFor(() =>
      expect(pay.markCashPaid).toHaveBeenCalledWith(
        "bk-pending-00000001",
        "Front desk cash collection",
      ),
    )
    expect(
      await screen.findByText("Payment recorded as SUCCEEDED (Cash)."),
    ).toBeInTheDocument()
  }, 15000)

  it("approves a pending stay request with an optional note", async () => {
    const user = userEvent.setup()
    render(<StaffPage />)
    await screen.findByRole("heading", { name: "Front Desk Console" })

    await user.click(screen.getByRole("button", { name: /^Stay Requests/ }))
    expect(
      await screen.findByRole("heading", { name: "Guest Stay Requests" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Early Check-In · Requested at 11:00"),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Decide" }))
    expect(await screen.findByText("Decide Stay Request")).toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText("e.g. Approved per hotel availability"),
      "Guest arrives early",
    )
    await user.click(screen.getByRole("button", { name: "Approve" }))

    await waitFor(() =>
      expect(mgr.decideStayRequest).toHaveBeenCalledWith("sr-1", {
        decision: "APPROVED",
        decisionNote: "Guest arrives early",
      }),
    )
    expect(
      await screen.findByText("Stay request approved!"),
    ).toBeInTheDocument()
  }, 15000)

  it("shows an error banner when the dashboard load fails", async () => {
    mgr.bookings.mockRejectedValue(new Error("Backend exploded"))

    render(<StaffPage />)

    expect(await screen.findByText("Backend exploded")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Dismiss notification" }),
    ).toBeInTheDocument()
  }, 15000)

  it("denies customers access to the staff console", async () => {
    useAuth
      .getState()
      .setSession({ user: customerUser, accessToken: "at", refreshToken: "rt" })

    render(<StaffPage />)

    expect(await screen.findByText("Restricted Portal")).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Front Desk Console" }),
    ).not.toBeInTheDocument()
  }, 15000)

  it("redirects managers to the manager console instead of the staff desk", async () => {
    useAuth
      .getState()
      .setSession({ user: managerUser, accessToken: "at", refreshToken: "rt" })

    render(<StaffPage />)

    expect(
      await screen.findByText("Redirecting to Manager Console…"),
    ).toBeInTheDocument()
    expect(mgr.bookings).not.toHaveBeenCalled()
  }, 15000)
})
