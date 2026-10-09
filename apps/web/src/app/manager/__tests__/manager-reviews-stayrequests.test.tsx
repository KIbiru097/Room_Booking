import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ManagerPage from "@/app/manager/page"
import { useAuth } from "@/lib/auth-store"
import { managerApi, hotelApi } from "@/lib/services"
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
    hotelApi: { ...actual.hotelApi, countries: jest.fn(), getById: jest.fn() },
  }
})

const mgr = managerApi as unknown as Record<string, jest.Mock>
const cat = hotelApi as unknown as Record<string, jest.Mock>

const managerUser: User = {
  id: "u-mgr",
  email: "miki@luxstay.test",
  fullName: "Miki Alemu",
  role: "MANAGER",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

const baseHotel = {
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

const booking = {
  id: "bk-lx-9931200",
  userId: "u-guest",
  hotelId: "h1",
  checkIn: "2026-10-12T00:00:00.000Z",
  checkOut: "2026-10-14T00:00:00.000Z",
  status: "CONFIRMED",
  totalPrice: 4200,
  createdAt: "2026-10-01T00:00:00.000Z",
  bookingRef: "LX-99312",
  user: {
    fullName: "Abebe Kebede",
    email: "abebe@example.com",
    phone: "+251911000001",
  },
}

const stayRequest = {
  id: "sr-1",
  status: "PENDING",
  type: "EARLY_CHECK_IN",
  requestedTime: "14:30",
  requestedCheckIn: "2026-10-12T00:00:00.000Z",
  requestedCheckOut: "2026-10-14T00:00:00.000Z",
  notes: "Landing early",
  bookingId: "bk-lx-9931200",
  userId: "u-guest",
  createdAt: "2026-10-02T00:00:00.000Z",
}

const review = {
  id: "rev-1",
  userId: "u-guest",
  hotelId: "h1",
  rating: 4,
  comment: "Lovely room with a quiet city view.",
  response: null,
  createdAt: "2026-09-20T00:00:00.000Z",
  user: { fullName: "Hana Tesfaye", email: "hana@example.com" },
  booking: { id: "bk-lx-9931200", bookingRef: "LX-99312" },
}

const renderManager = async () => {
  render(<ManagerPage />)
  await screen.findByRole("heading", { name: "Manager Overview" })
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

  mgr.hotels.mockResolvedValue([baseHotel])
  mgr.bookings.mockResolvedValue({ data: [booking] })
  mgr.stats.mockResolvedValue({
    pendingApprovals: 0,
    todaysCheckIns: 1,
    todaysCheckOuts: 0,
    activeGuests: 3,
  })
  mgr.action.mockResolvedValue(undefined)
  mgr.noShow.mockResolvedValue(undefined)
  mgr.createWalkIn.mockResolvedValue(undefined)
  mgr.decideStayRequest.mockResolvedValue(undefined)
  mgr.relocateRoom.mockResolvedValue(undefined)
  mgr.getPolicy.mockResolvedValue(null)
  mgr.getOperationalRooms.mockResolvedValue([])
  mgr.updateRoomStatus.mockResolvedValue(undefined)
  mgr.listStayRequests.mockResolvedValue([stayRequest])
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
    data: [review],
    meta: { total: 1, page: 1, pageSize: 20, pageCount: 1 },
    summary: {
      averageRating: 4,
      reviewCount: 1,
      respondedCount: 0,
      pendingResponseCount: 1,
    },
  })
  mgr.respondToReview.mockResolvedValue(undefined)
  cat.countries.mockResolvedValue([])
  cat.getById.mockResolvedValue({ ...baseHotel, rooms: [] })

  useAuth
    .getState()
    .setSession({ user: managerUser, accessToken: "at", refreshToken: "rt" })
})

describe("Manager stay requests, reviews and property switching", () => {
  it("approves a pending guest stay request", async () => {
    const user = userEvent.setup()
    await renderManager()

    expect(
      await screen.findByText(/Pending Guest Stay Requests \(1\)/),
    ).toBeInTheDocument()
    expect(screen.getByText("Early Check-In")).toBeInTheDocument()
    expect(screen.getByText(/Booking #/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Review & Decide" }))
    expect(
      await screen.findByRole("heading", { name: "Decide Stay Request" }),
    ).toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText("e.g. Room is ready for early check-in"),
      "Room already prepared",
    )
    await user.click(screen.getByRole("button", { name: "Approve Request" }))

    await waitFor(() =>
      expect(mgr.decideStayRequest).toHaveBeenCalledWith("sr-1", {
        decision: "APPROVED",
        decisionNote: "Room already prepared",
      }),
    )
    expect(
      await screen.findByText("Stay request approved!"),
    ).toBeInTheDocument()
  })

  it("publishes a public management response to a review", async () => {
    const user = userEvent.setup()
    await renderManager()

    await user.click(screen.getByRole("button", { name: /^Reviews/ }))
    expect(
      await screen.findByRole("heading", {
        name: "Guest Reviews & Public Responses",
      }),
    ).toBeInTheDocument()
    expect(screen.getByText("Total Reviews")).toBeInTheDocument()
    expect(screen.getByText("Needs Response")).toBeInTheDocument()
    expect(screen.getByText("Hana Tesfaye")).toBeInTheDocument()
    expect(
      screen.getByText("Lovely room with a quiet city view."),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Respond Publicly" }))
    await user.type(
      screen.getByPlaceholderText(
        "Write a professional, courteous response that will be visible to all potential guests...",
      ),
      "Thank you for staying with us!",
    )
    await user.click(screen.getByRole("button", { name: "Publish Response" }))

    await waitFor(() =>
      expect(mgr.respondToReview).toHaveBeenCalledWith(
        "h1",
        "rev-1",
        "Thank you for staying with us!",
      ),
    )
    expect(
      await screen.findByText(
        "Public management response published successfully.",
      ),
    ).toBeInTheDocument()
  })

  it("filters reviews down to the ones awaiting a response", async () => {
    const user = userEvent.setup()
    await renderManager()

    await user.click(screen.getByRole("button", { name: /^Reviews/ }))
    await screen.findByRole("heading", {
      name: "Guest Reviews & Public Responses",
    })

    await user.click(screen.getByRole("button", { name: "Responded (0)" }))

    expect(
      screen.getByText("No reviews found matching this filter."),
    ).toBeInTheDocument()
    expect(screen.queryByText("Hana Tesfaye")).not.toBeInTheDocument()
  })

  it("switches the active property from the sidebar selector", async () => {
    mgr.hotels.mockResolvedValue([
      baseHotel,
      { ...baseHotel, id: "h2", name: "Nile View Lodge" },
    ])
    const user = userEvent.setup()
    await renderManager()

    await user.selectOptions(screen.getByRole("combobox"), "h2")

    await waitFor(() => expect(cat.getById).toHaveBeenCalledWith("h2"))
    expect(
      await screen.findByText(
        "Live operations, revenue analytics, and occupancy for Nile View Lodge.",
      ),
    ).toBeInTheDocument()
  })
})
