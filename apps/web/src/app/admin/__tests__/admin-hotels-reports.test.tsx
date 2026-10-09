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
      createCoupon: jest.fn(),
      updateCoupon: jest.fn(),
      deleteCoupon: jest.fn(),
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

const baseHotel = {
  description: "Full service property in the capital",
  address: "Bole Road, Addis Ababa",
  city: { id: "c1", name: "Addis Ababa", country: { name: "Ethiopia" } },
  starRating: 4,
  averageRating: null,
  reviewCount: 0,
  lat: null,
  lng: null,
  images: [],
  amenities: [],
  rooms: [],
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
}

const pendingHotel = {
  ...baseHotel,
  id: "h-pending",
  name: "Skylight Suites",
  status: "PENDING_APPROVAL",
  manager: null,
  managerId: null,
}

const activeHotel = {
  ...baseHotel,
  id: "h-active",
  name: "Nile View Lodge",
  status: "ACTIVE",
  managerId: "u-mgr",
  manager: { id: "u-mgr", fullName: "Miki Alemu", email: "miki@luxstay.test" },
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

const renderTab = async (label: string, heading: string) => {
  const user = userEvent.setup()
  render(<AdminPage />)
  await screen.findByRole("heading", { name: "Platform Operations" })
  await user.click(screen.getByRole("button", { name: label }))
  await screen.findByRole("heading", { name: heading })
  return user
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
    userCount: 4,
    hotelCount: 2,
    bookingCount: 1,
    totalRevenue: 100,
  })
  adm.occupancy.mockResolvedValue({
    rooms: 10,
    occupiedRoomsToday: 4,
    occupancyRate: 0.4,
    breakdown: [],
  })
  adm.users.mockResolvedValue({ data: [] })
  adm.hotels.mockResolvedValue({ data: [pendingHotel, activeHotel] })
  adm.bookings.mockResolvedValue({ data: [booking] })
  adm.payments.mockResolvedValue({ data: [] })
  adm.reviews.mockResolvedValue({ data: [] })
  adm.auditLogs.mockResolvedValue([])
  adm.coupons.mockResolvedValue([])
  adm.settings.mockResolvedValue([])
  adm.monthlyRevenue.mockResolvedValue([])
  adm.bookingTrends.mockResolvedValue([])
  adm.mostBookedHotels.mockResolvedValue([])
  adm.approveHotel.mockResolvedValue(undefined)
  adm.setHotelStatus.mockResolvedValue(undefined)
  adm.createCoupon.mockResolvedValue(undefined)
  adm.downloadReport.mockResolvedValue(undefined)
  rev.remove.mockResolvedValue(undefined)
  hotelsApi.countries.mockResolvedValue([])

  useAuth
    .getState()
    .setSession({ user: adminUser, accessToken: "at", refreshToken: "rt" })
})

describe("Admin hotels, bookings, reports and coupons", () => {
  it("approves a pending hotel listing", async () => {
    const user = await renderTab("Hotels", "Hotel Properties & Approvals")

    expect(screen.getByText("Skylight Suites")).toBeInTheDocument()
    expect(screen.getByText("Nile View Lodge")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Approve" }))

    await waitFor(() =>
      expect(adm.approveHotel).toHaveBeenCalledWith("h-pending"),
    )
    expect(
      await screen.findByText("Hotel Skylight Suites approved and activated!"),
    ).toBeInTheDocument()
  })

  it("narrows the hotel table with the pending status filter and search", async () => {
    const user = await renderTab("Hotels", "Hotel Properties & Approvals")

    await user.click(screen.getByRole("button", { name: /^Pending/ }))
    expect(screen.getByText("Skylight Suites")).toBeInTheDocument()
    expect(screen.queryByText("Nile View Lodge")).not.toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText("Search hotels by name, city, address..."),
      "zzz",
    )

    expect(
      await screen.findByText("No hotels match your filters"),
    ).toBeInTheDocument()
  })

  it("lists platform bookings with amount and status", async () => {
    await renderTab("Bookings", "Platform Bookings")

    expect(screen.getByText("Skylight Hotel")).toBeInTheDocument()
    expect(screen.getByText("ETB 7,400")).toBeInTheDocument()
  })

  it("shows an empty state when there are no bookings", async () => {
    adm.bookings.mockResolvedValue({ data: [] })

    await renderTab("Bookings", "Platform Bookings")

    expect(
      await screen.findByText("No reservations found."),
    ).toBeInTheDocument()
  })

  it("downloads a report with the selected period and category", async () => {
    const user = await renderTab("Reports", "Platform Reports & Analytics")

    await user.click(screen.getByRole("button", { name: "Yearly (365 Days)" }))
    await user.click(screen.getByRole("button", { name: "Financial Revenue" }))
    await user.click(screen.getByRole("button", { name: "Download PDF" }))

    await waitFor(() =>
      expect(adm.downloadReport).toHaveBeenCalledWith(
        "revenue",
        "pdf",
        "yearly",
      ),
    )
    expect(
      await screen.findByText("Downloaded REVENUE PDF report (yearly)."),
    ).toBeInTheDocument()
  })

  it("creates a coupon from the coupon modal", async () => {
    const user = await renderTab("Coupons", "Promotional Coupons")

    await user.click(screen.getByRole("button", { name: "+ Create Coupon" }))
    expect(
      await screen.findByRole("heading", { name: "Create Coupon" }),
    ).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText("e.g. LUXSTAY20"), "save20")
    await user.click(screen.getByRole("button", { name: "Create Coupon" }))

    await waitFor(() =>
      expect(adm.createCoupon).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "SAVE20",
          discountType: "PERCENTAGE",
          value: 15,
        }),
      ),
    )
    expect(
      await screen.findByText("Coupon SAVE20 created!"),
    ).toBeInTheDocument()
  })
})
