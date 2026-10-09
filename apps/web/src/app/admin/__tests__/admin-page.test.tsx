import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import AdminPage from "@/app/admin/page"
import { useAuth } from "@/lib/auth-store"
import { adminApi, reviewApi, hotelApi } from "@/lib/services"
import type { User } from "@/lib/types"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/admin",
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
    adminApi: {
      ...actual.adminApi,
      overview: jest.fn(),
      occupancy: jest.fn(),
      users: jest.fn(),
      hotels: jest.fn(),
      bookings: jest.fn(),
      payments: jest.fn(),
      reviews: jest.fn(),
      auditLogs: jest.fn(),
      coupons: jest.fn(),
      settings: jest.fn(),
      monthlyRevenue: jest.fn(),
      bookingTrends: jest.fn(),
      mostBookedHotels: jest.fn(),
      setUserActive: jest.fn(),
      setHotelStatus: jest.fn(),
      approveHotel: jest.fn(),
      rejectHotel: jest.fn(),
      createUser: jest.fn(),
      createHotel: jest.fn(),
      downloadReport: jest.fn(),
      upsertSetting: jest.fn(),
      reassignManager: jest.fn(),
    },
    reviewApi: { ...actual.reviewApi, remove: jest.fn() },
    hotelApi: { ...actual.hotelApi, countries: jest.fn() },
  }
})

const adm = adminApi as unknown as Record<string, jest.Mock>
const rev = reviewApi as unknown as Record<string, jest.Mock>
const hotelsApi = hotelApi as unknown as Record<string, jest.Mock>

const adminUser: User = {
  id: "u-admin",
  email: "root@luxstay.test",
  fullName: "Root Admin",
  role: "ADMIN",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

const managerAccount = {
  id: "u-mgr",
  email: "miki@luxstay.test",
  fullName: "Miki Alemu",
  phone: "+251911000002",
  role: "MANAGER",
  isActive: true,
  createdAt: "2026-02-01T00:00:00.000Z",
}

const staffAccount = {
  ...managerAccount,
  id: "u-stf",
  fullName: "Sam Tesfaye",
  role: "STAFF",
}
const customerAccount = {
  ...managerAccount,
  id: "u-cst",
  fullName: "Hanna Girma",
  role: "CUSTOMER",
  isActive: false,
}

const booking = {
  id: "bk-00000042",
  userId: "u-guest",
  hotelId: "h1",
  hotel: { id: "h1", name: "Skylight Hotel" },
  checkIn: "2026-10-12T00:00:00.000Z",
  checkOut: "2026-10-14T00:00:00.000Z",
  status: "CONFIRMED",
  totalPrice: 7400,
  createdAt: "2026-10-01T00:00:00.000Z",
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

  adm.overview.mockResolvedValue({
    userCount: 120,
    hotelCount: 12,
    bookingCount: 340,
    totalRevenue: 987650,
  })
  adm.occupancy.mockResolvedValue({
    rooms: 40,
    occupiedRoomsToday: 20,
    occupancyRate: 0.5,
    breakdown: [],
  })
  adm.users.mockResolvedValue({
    data: [managerAccount, staffAccount, customerAccount],
  })
  adm.hotels.mockResolvedValue({ data: [] })
  adm.bookings.mockResolvedValue({ data: [booking] })
  adm.payments.mockResolvedValue({ data: [] })
  adm.reviews.mockResolvedValue({ data: [] })
  adm.auditLogs.mockResolvedValue([])
  adm.coupons.mockResolvedValue([])
  adm.settings.mockResolvedValue([])
  adm.monthlyRevenue.mockResolvedValue([])
  adm.bookingTrends.mockResolvedValue([])
  adm.mostBookedHotels.mockResolvedValue([])
  adm.setUserActive.mockResolvedValue(undefined)
  adm.approveHotel.mockResolvedValue(undefined)
  adm.downloadReport.mockResolvedValue(undefined)
  rev.remove.mockResolvedValue(undefined)
  hotelsApi.countries.mockResolvedValue([])

  useAuth
    .getState()
    .setSession({ user: adminUser, accessToken: "at", refreshToken: "rt" })
})

describe("AdminDashboardPage", () => {
  it("renders platform metrics and latest reservations", async () => {
    render(<AdminPage />)

    expect(
      await screen.findByRole("heading", { name: "Platform Operations" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Total users")).toBeInTheDocument()
    expect(screen.getByText("120")).toBeInTheDocument()
    expect(screen.getByText("Platform revenue")).toBeInTheDocument()
    expect(screen.getByText("ETB 987,650")).toBeInTheDocument()
    expect(screen.getByText("Today's Occupancy Rate")).toBeInTheDocument()
    expect(screen.getByText("50.0%")).toBeInTheDocument()
    expect(screen.getByText("Latest Reservations")).toBeInTheDocument()
    expect(screen.getByText("Skylight Hotel")).toBeInTheDocument()
  })

  it("blocks non-admin accounts from the console", async () => {
    useAuth
      .getState()
      .setSession({
        user: { ...adminUser, role: "STAFF" },
        accessToken: "at",
        refreshToken: "rt",
      })

    render(<AdminPage />)

    expect(await screen.findByText("Restricted Portal")).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Platform Operations" }),
    ).not.toBeInTheDocument()
  })

  it("filters the user table by role and search term", async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    await screen.findByRole("heading", { name: "Platform Operations" })

    await user.click(screen.getByRole("button", { name: "Users" }))
    await screen.findByRole("heading", { name: "User Accounts" })

    await user.click(screen.getByRole("button", { name: /^Manager/ }))
    expect(screen.getByText("Miki Alemu")).toBeInTheDocument()
    expect(screen.queryByText("Sam Tesfaye")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /^All Roles/ }))
    await user.type(
      screen.getByPlaceholderText("Search by name, email..."),
      "zzz",
    )

    expect(
      await screen.findByText(
        "No users matching the selected filter or search term.",
      ),
    ).toBeInTheDocument()
  })

  it("suspends an active user through the admin API", async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    await screen.findByRole("heading", { name: "Platform Operations" })

    await user.click(screen.getByRole("button", { name: "Users" }))
    expect(
      await screen.findByRole("heading", { name: "User Accounts" }),
    ).toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "Suspend" })[0])

    await waitFor(() =>
      expect(adm.setUserActive).toHaveBeenCalledWith("u-mgr", false),
    )
    expect(
      await screen.findByText("User Miki Alemu suspended."),
    ).toBeInTheDocument()
  })

  it("surfaces a load failure as an error banner", async () => {
    adm.users.mockImplementation(() => {
      throw new Error("boom")
    })

    render(<AdminPage />)

    expect(await screen.findByText("boom")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Dismiss notification" }),
    ).toBeInTheDocument()
  })
})
