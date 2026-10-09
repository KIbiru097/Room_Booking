import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ManagerPage from "@/app/manager/page"
import { useAuth } from "@/lib/auth-store"
import { managerApi, hotelApi, paymentApi } from "@/lib/services"
import type { User } from "@/lib/types"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/manager",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "x" }),
}))

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => () => null,
}))

jest.mock("@/lib/services", () => {
  const actual = jest.requireActual("@/lib/services")
  return {
    ...actual,
    managerApi: {
      ...actual.managerApi,
      navigationItems: jest.fn().mockResolvedValue([]),
      dashboardLayouts: jest.fn().mockResolvedValue([]),
      hotels: jest.fn(),
      bookings: jest.fn(),
      stats: jest.fn(),
      action: jest.fn(),
      noShow: jest.fn(),
      createWalkIn: jest.fn(),
      decideStayRequest: jest.fn(),
      relocateRoom: jest.fn(),
      getPolicy: jest.fn(),
      getOperationalRooms: jest.fn(),
      updateRoomStatus: jest.fn(),
      listStayRequests: jest.fn(),
      listStaff: jest.fn(),
      reportOverview: jest.fn(),
      reportRevenue: jest.fn(),
      reportTrends: jest.fn(),
      reportOccupancy: jest.fn(),
      listReviews: jest.fn(),
      respondToReview: jest.fn(),
      deleteReviewResponse: jest.fn(),
    },
    paymentApi: { ...actual.paymentApi, markCashPaid: jest.fn() },
    hotelApi: { ...actual.hotelApi, countries: jest.fn(), getById: jest.fn() },
  }
})

const mgr = managerApi as unknown as Record<string, jest.Mock>
const pay = paymentApi as unknown as Record<string, jest.Mock>
const cat = hotelApi as unknown as Record<string, jest.Mock>

const managerUser: User = {
  id: "u-mgr",
  email: "miki@luxstay.test",
  fullName: "Miki Alemu",
  role: "MANAGER",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

const hotel = {
  id: "h1",
  name: "Skylight Hotel",
  description: "Central business hotel",
  address: "Bole Road, Addis Ababa",
  status: "ACTIVE",
  starRating: 5,
  city: { id: "c1", name: "Addis Ababa", country: { name: "Ethiopia" } },
  images: [],
  amenities: [],
  rooms: [],
  _count: { rooms: 8, bookings: 4 },
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

const openBooking = {
  ...pendingBooking,
  id: "bk-unpaid-00000003",
  status: "CHECKED_IN",
  user: { fullName: "Dawit Alemu", email: "dawit@example.com", phone: null },
  payment: {
    id: "p1",
    bookingId: "bk-unpaid-00000003",
    method: "CASH",
    amount: 4200,
    status: "PENDING",
    createdAt: "2026-10-01T00:00:00.000Z",
  },
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

  mgr.hotels.mockResolvedValue([hotel])
  mgr.bookings.mockResolvedValue({
    data: [pendingBooking, confirmedBooking, openBooking],
  })
  mgr.stats.mockResolvedValue({
    pendingApprovals: 2,
    todaysCheckIns: 6,
    todaysCheckOuts: 1,
    activeGuests: 9,
  })
  mgr.action.mockResolvedValue(undefined)
  mgr.noShow.mockResolvedValue(undefined)
  mgr.createWalkIn.mockResolvedValue(undefined)
  mgr.decideStayRequest.mockResolvedValue(undefined)
  mgr.relocateRoom.mockResolvedValue(undefined)
  mgr.getPolicy.mockResolvedValue(null)
  mgr.getOperationalRooms.mockResolvedValue([])
  mgr.updateRoomStatus.mockResolvedValue(undefined)
  mgr.listStayRequests.mockResolvedValue([])
  mgr.listStaff.mockResolvedValue({ data: [] })
  mgr.reportOverview.mockResolvedValue({
    totalRevenue: 150000,
    totalBookings: 42,
    activeRooms: 8,
    occupancyRate: 0.62,
    occupiedToday: 5,
  })
  mgr.reportRevenue.mockResolvedValue([])
  mgr.reportTrends.mockResolvedValue([])
  mgr.reportOccupancy.mockResolvedValue({
    totalRooms: 8,
    occupiedToday: 5,
    occupancyRate: 0.62,
  })
  mgr.listReviews.mockResolvedValue({
    data: [],
    meta: { total: 0, page: 1, pageSize: 20, pageCount: 0 },
    summary: {
      averageRating: null,
      reviewCount: 0,
      respondedCount: 0,
      pendingResponseCount: 0,
    },
  })
  pay.markCashPaid.mockResolvedValue(undefined)
  cat.countries.mockResolvedValue([])
  cat.getById.mockResolvedValue({ ...hotel, rooms: [] })
  mgr.navigationItems.mockResolvedValue([])
  mgr.dashboardLayouts.mockResolvedValue([])

  useAuth
    .getState()
    .setSession({ user: managerUser, accessToken: "at", refreshToken: "rt" })
})

describe("ManagerDashboardPage", () => {
  it("renders the overview with property metrics and recent reservations", async () => {
    render(<ManagerPage />)

    expect(
      await screen.findByRole("heading", { name: "Manager Overview" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Live operations, revenue analytics, and occupancy for Skylight Hotel.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("Property Revenue")).toBeInTheDocument()
    expect(screen.getByText("Today's Occupancy")).toBeInTheDocument()
    expect(screen.getByText("Total Bookings")).toBeInTheDocument()
    expect(screen.getByText("Pending approvals")).toBeInTheDocument()
    expect(screen.getByText("Recent Reservations")).toBeInTheDocument()
    expect(screen.getByText("Abebe Kebede")).toBeInTheDocument()
  })

  it("confirms a pending reservation from the overview", async () => {
    const user = userEvent.setup()
    render(<ManagerPage />)
    await screen.findByRole("heading", { name: "Manager Overview" })

    await user.click(screen.getByRole("button", { name: "Confirm" }))

    await waitFor(() =>
      expect(mgr.action).toHaveBeenCalledWith("bk-pending-00000001", "confirm"),
    )
    expect(
      await screen.findByText("Booking marked as confirmed."),
    ).toBeInTheDocument()
  })

  it("records cash payment for a checked-in stay from the Bookings tab", async () => {
    const user = userEvent.setup()
    render(<ManagerPage />)
    await screen.findByRole("heading", { name: "Manager Overview" })

    await user.click(screen.getByRole("button", { name: "Bookings" }))
    expect(
      await screen.findByRole("heading", { name: "Guest Reservations" }),
    ).toBeInTheDocument()
    expect(screen.getByText("3 reservations on file")).toBeInTheDocument()

    const cashButtons = screen.getAllByRole("button", {
      name: "Mark Cash Paid",
    })
    expect(cashButtons).toHaveLength(3)
    await user.click(cashButtons[2])

    await waitFor(() =>
      expect(pay.markCashPaid).toHaveBeenCalledWith(
        "bk-unpaid-00000003",
        "Cash paid at front desk",
      ),
    )
    expect(
      await screen.findByText("Payment marked as SUCCEEDED (Cash)."),
    ).toBeInTheDocument()
  })

  it("shows the empty state when the hotel has no reservations", async () => {
    mgr.bookings.mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    render(<ManagerPage />)
    await screen.findByRole("heading", { name: "Manager Overview" })

    await user.click(screen.getByRole("button", { name: "Bookings" }))
    await screen.findByRole("heading", { name: "Guest Reservations" })

    expect(
      await screen.findByText("No reservations recorded."),
    ).toBeInTheDocument()
    expect(screen.getByText("0 reservations on file")).toBeInTheDocument()
  })

  it("blocks customers from the manager console", async () => {
    useAuth.getState().setSession({
      user: { ...managerUser, role: "CUSTOMER" },
      accessToken: "at",
      refreshToken: "rt",
    })

    render(<ManagerPage />)

    expect(await screen.findByText("Restricted Portal")).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Manager Overview" }),
    ).not.toBeInTheDocument()
  })

  it("honours navigation builder visibility toggles and renames in the sidebar", async () => {
    mgr.navigationItems.mockResolvedValue([
      {
        id: "n1",
        label: "Hotel coupons",
        route: "/manager/coupons",
        position: 3,
        enabled: false,
        isSystem: true,
      },
      {
        id: "n2",
        label: "Promotions",
        route: "/manager/roles",
        position: 0,
        enabled: true,
        isSystem: false,
      },
    ])

    render(<ManagerPage />)
    await screen.findByRole("heading", { name: "Manager Overview" })

    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: "Hotel coupons" }),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByRole("link", { name: "Promotions" })).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Dashboard layouts" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Bookings" })).toBeInTheDocument()
  })

  it("renders the overview with the active dashboard layout density and widgets", async () => {
    mgr.dashboardLayouts.mockResolvedValue([
      {
        id: "l1",
        name: "Front desk",
        layout: "compact",
        isDefault: true,
        widgets: [
          { key: "occupancy", position: 0, isVisible: true },
          { key: "arrivals", position: 1, isVisible: true },
        ],
      },
    ])

    render(<ManagerPage />)
    await screen.findByRole("heading", { name: "Manager Overview" })

    await waitFor(() =>
      expect(screen.queryByText("Property Revenue")).not.toBeInTheDocument(),
    )
    expect(screen.queryByText("Pending approvals")).not.toBeInTheDocument()
    expect(screen.queryByText("Today's check-outs")).not.toBeInTheDocument()
    expect(screen.getByText("Total Bookings")).toBeInTheDocument()
    expect(screen.getByText("Today's check-ins")).toBeInTheDocument()
    expect(screen.getByText("Today's Occupancy")).toBeInTheDocument()
    expect(document.querySelector(".gap-3")).toBeInTheDocument()
  })
})
