import { render, screen, waitFor, within } from "@testing-library/react"
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
      addHotelImages: jest.fn(),
      createCoupon: jest.fn(),
      updateCoupon: jest.fn(),
      deleteCoupon: jest.fn(),
      deleteSetting: jest.fn(),
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
  id: "h-active",
  name: "Nile View Lodge",
  status: "ACTIVE",
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
  managerId: "u-mgr",
  manager: { id: "u-mgr", fullName: "Miki Alemu", email: "miki@luxstay.test" },
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
}

const booking = {
  id: "bk-00000042",
  userId: "u-guest",
  hotelId: "h-active",
  hotel: { id: "h-active", name: "Nile View Lodge" },
  checkIn: "2026-10-12T00:00:00.000Z",
  checkOut: "2026-10-14T00:00:00.000Z",
  status: "CONFIRMED",
  totalPrice: 7400,
  createdAt: "2026-10-01T00:00:00.000Z",
}

const payment = {
  id: "pay-00000077",
  bookingId: "bk-00000042",
  method: "TELEBIRR",
  amount: 7400,
  status: "SUCCEEDED",
  providerRef: "tel-9911",
  createdAt: "2026-10-02T08:30:00.000Z",
  booking: {
    id: "bk-00000042",
    hotel: { id: "h-active", name: "Nile View Lodge" },
  },
}

const review = {
  id: "rv-1",
  userId: "u-guest",
  hotelId: "h-active",
  rating: 4,
  comment: "Great location and helpful staff.",
  response: null,
  createdAt: "2026-09-20T10:00:00.000Z",
  user: {
    id: "u-guest",
    fullName: "Sara Bekele",
    email: "sara@luxstay.test",
    role: "CUSTOMER",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  hotel: { id: "h-active", name: "Nile View Lodge" },
}

const auditEntries = [
  {
    id: "a1",
    actor: "root@luxstay.test",
    action: "HOTEL_APPROVED",
    resource: "h-active",
    resourceType: "HOTEL",
    createdAt: "2026-10-01T09:00:00.000Z",
  },
  {
    id: "a2",
    actor: { email: "ops@luxstay.test" },
    resourceType: "BOOKING_STATE",
    createdAt: "2026-10-02T09:15:00.000Z",
  },
]

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
  jest.restoreAllMocks()
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
    hotelCount: 1,
    bookingCount: 1,
    totalRevenue: 5000,
  })
  adm.occupancy.mockResolvedValue({
    rooms: 10,
    occupiedRoomsToday: 4,
    occupancyRate: 0.4,
    breakdown: [],
  })
  adm.users.mockResolvedValue({ data: [] })
  adm.hotels.mockResolvedValue({ data: [baseHotel] })
  adm.bookings.mockResolvedValue({ data: [booking] })
  adm.payments.mockResolvedValue({ data: [payment] })
  adm.reviews.mockResolvedValue({ data: [review] })
  adm.auditLogs.mockResolvedValue(auditEntries)
  adm.coupons.mockResolvedValue([])
  adm.settings.mockResolvedValue([])
  adm.monthlyRevenue.mockResolvedValue([])
  adm.bookingTrends.mockResolvedValue([])
  adm.mostBookedHotels.mockResolvedValue([])
  adm.setUserActive.mockResolvedValue(undefined)
  adm.setHotelStatus.mockResolvedValue(undefined)
  adm.approveHotel.mockResolvedValue(undefined)
  adm.rejectHotel.mockResolvedValue(undefined)
  adm.createUser.mockResolvedValue(undefined)
  adm.createHotel.mockResolvedValue(undefined)
  adm.addHotelImages.mockResolvedValue(undefined)
  adm.createCoupon.mockResolvedValue(undefined)
  adm.updateCoupon.mockResolvedValue(undefined)
  adm.deleteCoupon.mockResolvedValue(undefined)
  adm.deleteSetting.mockResolvedValue(undefined)
  adm.downloadReport.mockResolvedValue(undefined)
  adm.upsertSetting.mockResolvedValue(undefined)
  adm.reassignManager.mockResolvedValue(undefined)
  rev.remove.mockResolvedValue(undefined)
  hotelsApi.countries.mockResolvedValue([])

  useAuth
    .getState()
    .setSession({ user: adminUser, accessToken: "at", refreshToken: "rt" })
})

describe("Dashboard interactions", () => {
  it("refreshes data, jumps to bookings and dismisses banners", async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    await screen.findByRole("heading", { name: "Platform Operations" })

    expect(adm.overview).toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Refresh" }))
    await waitFor(() => expect(adm.overview).toHaveBeenCalledTimes(2))

    await user.click(screen.getByRole("button", { name: "View all →" }))
    expect(
      await screen.findByRole("heading", { name: "Platform Bookings" }),
    ).toBeInTheDocument()
  })

  it("clears banners and signs out from the sidebar", async () => {
    adm.overview.mockImplementation(() => {
      throw new Error("metrics unavailable")
    })
    const user = userEvent.setup()
    render(<AdminPage />)

    expect(await screen.findByText("metrics unavailable")).toBeInTheDocument()
    await user.click(
      screen.getAllByRole("button", { name: "Dismiss notification" })[0],
    )
    expect(screen.queryByText("metrics unavailable")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Sign out" }))
    expect(useAuth.getState().user).toBeNull()
    expect(useAuth.getState().tokens).toBeNull()
  })
})

describe("Bookings, payments and reviews tabs", () => {
  it("lists payments with amount, method and status", async () => {
    const user = await renderTab("Payments", "Payment Transactions")

    expect(await screen.findByText("Nile View Lodge")).toBeInTheDocument()
    expect(screen.getByText("ETB 7,400")).toBeInTheDocument()
    expect(screen.getByText(/Telebirr/)).toBeInTheDocument()
    expect(screen.getByText("Paid")).toBeInTheDocument()
    expect(user).toBeTruthy()
  })

  it("shows the empty payment state", async () => {
    adm.payments.mockResolvedValue({ data: [] })
    await renderTab("Payments", "Payment Transactions")

    expect(
      await screen.findByText("No payment records found."),
    ).toBeInTheDocument()
  })

  it("deletes a review and surfaces removal failures", async () => {
    const user = await renderTab("Reviews", "Customer Reviews")

    expect(
      await screen.findByText("Great location and helpful staff."),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Nile View Lodge · Sep 20, 2026"),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Delete" }))
    await waitFor(() => expect(rev.remove).toHaveBeenCalledWith("rv-1"))
    expect(await screen.findByText("Review deleted.")).toBeInTheDocument()

    rev.remove.mockRejectedValueOnce(new Error("review locked"))
    adm.reviews.mockResolvedValue({ data: [review] })
    await user.click(screen.getByRole("button", { name: "Delete" }))
    expect(await screen.findByText("review locked")).toBeInTheDocument()
  })

  it("shows the empty review state", async () => {
    adm.reviews.mockResolvedValue({ data: [] })
    await renderTab("Reviews", "Customer Reviews")

    expect(await screen.findByText("No reviews recorded.")).toBeInTheDocument()
  })

  it("lists bookings with dates, amount and status", async () => {
    await renderTab("Bookings", "Platform Bookings")

    expect(await screen.findByText("Nile View Lodge")).toBeInTheDocument()
    expect(screen.getByText("ETB 7,400")).toBeInTheDocument()
    expect(screen.getByText("Confirmed")).toBeInTheDocument()
  })

  it("shows empty bookings state", async () => {
    adm.bookings.mockResolvedValue({ data: [] })
    await renderTab("Bookings", "Platform Bookings")

    expect(
      await screen.findByText("No reservations found."),
    ).toBeInTheDocument()
  })
})

describe("Audit logs tab", () => {
  it("renders actor, action and resource columns", async () => {
    await renderTab("Audit Logs", "Audit Trail")

    expect(await screen.findByText("root@luxstay.test")).toBeInTheDocument()
    expect(screen.getByText("ops@luxstay.test")).toBeInTheDocument()
    expect(screen.getByText("HOTEL_APPROVED")).toBeInTheDocument()
    expect(screen.getByText("BOOKING STATE")).toBeInTheDocument()
    expect(screen.getByText("h-active")).toBeInTheDocument()
    expect(screen.getAllByText(/Oct 1, 2026/).length).toBeGreaterThan(0)
  })

  it("shows the empty audit state", async () => {
    adm.auditLogs.mockResolvedValue([])
    await renderTab("Audit Logs", "Audit Trail")

    expect(
      await screen.findByText("No audit events logged."),
    ).toBeInTheDocument()
  })
})

describe("Reports tab", () => {
  it("shows KPI cards and switches timeframe and category", async () => {
    const user = await renderTab("Reports", "Platform Reports & Analytics")

    expect(screen.getByText("Gross Revenue")).toBeInTheDocument()
    expect(screen.getByText("ETB 5,000")).toBeInTheDocument()
    expect(screen.getByText("Total Reservations")).toBeInTheDocument()
    expect(screen.getByText("Active Hotel Listings")).toBeInTheDocument()
    expect(screen.getByText("40.0%")).toBeInTheDocument()
    expect(
      screen.getByText("Report Preview (OVERVIEW — MONTHLY)"),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Weekly (7 Days)" }))
    expect(
      await screen.findByText("Report Preview (OVERVIEW — WEEKLY)"),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Reservations" }))
    expect(
      await screen.findByText("Report Preview (BOOKING — WEEKLY)"),
    ).toBeInTheDocument()
    expect(await screen.findByText("bk-00000042".slice(-8))).toBeInTheDocument()
  })

  it("renders revenue rows from payments", async () => {
    await renderTab("Reports", "Platform Reports & Analytics")
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Financial Revenue" }))

    expect(
      await screen.findByText("Report Preview (REVENUE — MONTHLY)"),
    ).toBeInTheDocument()
    expect(screen.getByText("tel-9911")).toBeInTheDocument()
    expect(screen.getByText("ETB 7,400")).toBeInTheDocument()
  })

  it("renders occupancy rows from hotels", async () => {
    const user = await renderTab("Reports", "Platform Reports & Analytics")

    await user.click(screen.getByRole("button", { name: "Room Occupancy" }))
    expect(
      await screen.findByText("Report Preview (OCCUPANCY — MONTHLY)"),
    ).toBeInTheDocument()
    expect(screen.getByText("Nile View Lodge")).toBeInTheDocument()
    expect(screen.getByText("4 Stars")).toBeInTheDocument()
    expect(screen.getByText("Addis Ababa")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Guest Demographics" }))
    expect(
      await screen.findByText("Report Preview (CUSTOMER — MONTHLY)"),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cancellations" }))
    expect(
      await screen.findByText("Report Preview (CANCELLATION — MONTHLY)"),
    ).toBeInTheDocument()
  })

  it("downloads a PDF and an Excel export for the selected window", async () => {
    const user = await renderTab("Reports", "Platform Reports & Analytics")

    await user.click(screen.getByRole("button", { name: "Download PDF" }))
    await waitFor(() =>
      expect(adm.downloadReport).toHaveBeenCalledWith(
        "overview",
        "pdf",
        "monthly",
      ),
    )
    expect(
      await screen.findByText("Downloaded OVERVIEW PDF report (monthly)."),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Download Excel" }))
    await waitFor(() =>
      expect(adm.downloadReport).toHaveBeenCalledWith(
        "overview",
        "excel",
        "monthly",
      ),
    )
    expect(
      await screen.findByText(
        "Downloaded OVERVIEW Excel spreadsheet (monthly).",
      ),
    ).toBeInTheDocument()
  })

  it("reports PDF and Excel download failures", async () => {
    adm.downloadReport.mockRejectedValueOnce(new Error("export queue full"))
    const user = await renderTab("Reports", "Platform Reports & Analytics")

    await user.click(screen.getByRole("button", { name: "Download PDF" }))
    expect(await screen.findByText("export queue full")).toBeInTheDocument()

    adm.downloadReport.mockRejectedValueOnce(new Error("sheet render failed"))
    await user.click(screen.getByRole("button", { name: "Download Excel" }))
    expect(await screen.findByText("sheet render failed")).toBeInTheDocument()
  })

  it("shows the empty preview table when no records exist", async () => {
    adm.hotels.mockResolvedValue({ data: [] })
    adm.bookings.mockResolvedValue({ data: [] })
    adm.payments.mockResolvedValue({ data: [] })

    await renderTab("Reports", "Platform Reports & Analytics")

    expect(
      await screen.findByText("Report Preview (OVERVIEW — MONTHLY)"),
    ).toBeInTheDocument()
    const table = screen.getAllByRole("table").at(-1) as HTMLElement
    expect(within(table).queryAllByRole("row")).toHaveLength(1)
  })
})
