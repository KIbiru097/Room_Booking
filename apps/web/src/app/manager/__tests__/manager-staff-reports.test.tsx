import { fireEvent, render, screen, waitFor } from "@testing-library/react"
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
      getPolicy: jest.fn(),
      updateRoomStatus: jest.fn(),
      listStayRequests: jest.fn(),
      listStaff: jest.fn(),
      reportOverview: jest.fn(),
      reportRevenue: jest.fn(),
      reportTrends: jest.fn(),
      reportOccupancy: jest.fn(),
      listReviews: jest.fn(),
      createRoom: jest.fn(),
      updateRoom: jest.fn(),
      deleteRoom: jest.fn(),
      blockMaintenance: jest.fn(),
      upsertSeasonalPricing: jest.fn(),
      deleteSeasonalPricing: jest.fn(),
      upsertPolicy: jest.fn(),
      createHotel: jest.fn(),
      updateHotel: jest.fn(),
      createStaff: jest.fn(),
      assignStaff: jest.fn(),
      updateStaffStatus: jest.fn(),
      removeStaff: jest.fn(),
      downloadReport: jest.fn(),
    },
    paymentApi: { ...actual.paymentApi, markCashPaid: jest.fn() },
    hotelApi: {
      ...actual.hotelApi,
      countries: jest.fn(),
      getById: jest.fn(),
      cities: jest.fn(),
    },
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

const room101 = {
  id: "r1",
  hotelId: "h1",
  roomNumber: "101",
  type: "DELUXE",
  capacity: 2,
  beds: 1,
  bathroom: 1,
  basePrice: 4500,
  amenities: ["WiFi"],
  description: "",
  status: "AVAILABLE",
}

const staffHana = {
  id: "hs1",
  hotelId: "h1",
  staffId: "u-s1",
  role: "Front Desk",
  assignedAt: "2026-03-05T12:00:00.000Z",
  staff: {
    id: "u-s1",
    fullName: "Hana Girma",
    email: "hana@luxstay.test",
    phone: "+251911223344",
    isActive: true,
  },
}

const staffTesfaye = {
  id: "hs2",
  hotelId: "h1",
  staffId: "u-s2",
  role: "Housekeeping",
  assignedAt: "2026-04-11T12:00:00.000Z",
  staff: {
    id: "u-s2",
    fullName: "Tesfaye Alemu",
    email: "tesfaye@luxstay.test",
    phone: null,
    isActive: false,
  },
}

const confirmedBooking = {
  id: "bk-aaa-00000001",
  bookingRef: "LX-1001",
  userId: "u1",
  hotelId: "h1",
  checkIn: "2026-10-12T00:00:00.000Z",
  checkOut: "2026-10-14T00:00:00.000Z",
  status: "CONFIRMED",
  totalPrice: 4200,
  user: {
    fullName: "Abebe Kebede",
    email: "abebe@example.com",
    phone: "+251911000001",
  },
}

const cancelledBooking = {
  ...confirmedBooking,
  id: "bk-bbb-00000002",
  bookingRef: "LX-1002",
  userId: "u2",
  status: "CANCELLED",
  user: { fullName: "Sara Bekele", email: "sara@example.com", phone: null },
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

  mgr.hotels.mockResolvedValue([hotel])
  mgr.bookings.mockResolvedValue({ data: [confirmedBooking, cancelledBooking] })
  mgr.stats.mockResolvedValue({
    pendingApprovals: 1,
    todaysCheckIns: 2,
    todaysCheckOuts: 1,
    activeGuests: 3,
  })
  mgr.action.mockResolvedValue(undefined)
  mgr.getPolicy.mockResolvedValue(null)
  mgr.updateRoomStatus.mockResolvedValue(undefined)
  mgr.listStayRequests.mockResolvedValue([])
  mgr.listStaff.mockResolvedValue({ data: [] })
  mgr.reportOverview.mockResolvedValue({
    totalRevenue: 150000,
    totalBookings: 42,
    activeRooms: 8,
    occupancyRate: 0.62,
    occupiedToday: 5,
    cancelledBookings: 4,
    confirmedBookings: 30,
  })
  mgr.reportRevenue.mockResolvedValue([
    { month: "Oct 2026", revenue: 120000, bookings: 9 },
  ])
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
  mgr.createRoom.mockResolvedValue(undefined)
  mgr.updateRoom.mockResolvedValue(undefined)
  mgr.deleteRoom.mockResolvedValue(undefined)
  mgr.blockMaintenance.mockResolvedValue(undefined)
  mgr.upsertSeasonalPricing.mockResolvedValue(undefined)
  mgr.deleteSeasonalPricing.mockResolvedValue(undefined)
  mgr.upsertPolicy.mockResolvedValue(undefined)
  mgr.createHotel.mockResolvedValue(undefined)
  mgr.updateHotel.mockResolvedValue(undefined)
  mgr.createStaff.mockResolvedValue(undefined)
  mgr.assignStaff.mockResolvedValue(undefined)
  mgr.updateStaffStatus.mockResolvedValue(undefined)
  mgr.removeStaff.mockResolvedValue(undefined)
  mgr.downloadReport.mockResolvedValue(undefined)
  cat.countries.mockResolvedValue([])
  cat.cities.mockResolvedValue([])
  cat.getById.mockResolvedValue({ ...hotel, rooms: [room101] })

  useAuth
    .getState()
    .setSession({ user: managerUser, accessToken: "at", refreshToken: "rt" })
})

const renderTab = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) => {
  render(<ManagerPage />)
  await screen.findByRole("heading", { name: "Manager Overview" })
  await user.click(screen.getByRole("button", { name }))
}

describe("Staff tab", () => {
  it("shows the empty state and opens the add staff modal", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Staff")

    expect(
      await screen.findByRole("heading", {
        name: "Hotel Staff & Operations Team",
      }),
    ).toBeInTheDocument()
    expect(screen.getByText("No Staff Members Assigned")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "+ Add Your First Staff Member" }),
    )
    expect(
      await screen.findByRole("heading", { name: "Add Staff Member" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Create New Staff Account")).toBeInTheDocument()
    expect(
      screen.getByText("Assign Existing Staff by Email"),
    ).toBeInTheDocument()
  })

  it("lists staff, filters the table, and clears the search", async () => {
    mgr.listStaff.mockResolvedValue({ data: [staffHana, staffTesfaye] })
    const user = userEvent.setup()
    await renderTab(user, "Staff")

    expect(await screen.findByText("Hana Girma")).toBeInTheDocument()
    expect(screen.getByText("Tesfaye Alemu")).toBeInTheDocument()
    expect(screen.getByText("tesfaye@luxstay.test")).toBeInTheDocument()
    expect(screen.getByText("No phone provided")).toBeInTheDocument()
    expect(screen.getByText("Deactivated")).toBeInTheDocument()

    const search = screen.getByPlaceholderText(
      "Search by name, email, or phone...",
    )
    await user.type(search, "hana")
    await waitFor(() =>
      expect(screen.queryByText("Tesfaye Alemu")).not.toBeInTheDocument(),
    )

    await user.click(screen.getByRole("button", { name: "Clear search" }))
    expect(await screen.findByText("Tesfaye Alemu")).toBeInTheDocument()
    expect(search).toHaveValue("")
  })

  it("creates a staff account with a preset role", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Staff")
    await screen.findByRole("heading", {
      name: "Hotel Staff & Operations Team",
    })

    await user.click(
      screen.getByRole("button", { name: /\+ Add Staff Member/ }),
    )
    await screen.findByRole("heading", { name: "Add Staff Member" })

    await user.type(
      screen.getByPlaceholderText("e.g. Abebe Bekele"),
      "Bekele Wolde",
    )
    await user.type(
      screen.getByPlaceholderText("e.g. abebe@grandskylight.com"),
      "bekele@luxstay.test",
    )
    await user.type(
      screen.getByPlaceholderText("Minimum 8 characters"),
      "secret123",
    )
    await user.type(
      screen.getByPlaceholderText("e.g. +251 91 123 4567"),
      "+251911556677",
    )
    await user.click(screen.getByRole("button", { name: "Cleaner" }))

    await user.click(
      screen.getByRole("button", { name: "Create & Assign Staff" }),
    )

    await waitFor(() =>
      expect(mgr.createStaff).toHaveBeenCalledWith("h1", {
        fullName: "Bekele Wolde",
        email: "bekele@luxstay.test",
        password: "secret123",
        phone: "+251911556677",
        role: "Cleaner",
      }),
    )
    expect(
      await screen.findByText(
        "Staff member (Cleaner) created and assigned to hotel successfully!",
      ),
    ).toBeInTheDocument()
  })

  it("reveals and hides the staff password field", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Staff")
    await screen.findByRole("heading", {
      name: "Hotel Staff & Operations Team",
    })

    await user.click(
      screen.getByRole("button", { name: /\+ Add Staff Member/ }),
    )
    await screen.findByRole("heading", { name: "Add Staff Member" })

    const passwordField = screen.getByPlaceholderText("Minimum 8 characters")
    expect(passwordField).toHaveAttribute("type", "password")

    await user.click(screen.getByRole("button", { name: "Show password" }))
    expect(passwordField).toHaveAttribute("type", "text")

    await user.click(screen.getByRole("button", { name: "Hide password" }))
    expect(passwordField).toHaveAttribute("type", "password")
  })

  it("surfaces client-side validation for name and password", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Staff")
    await screen.findByRole("heading", {
      name: "Hotel Staff & Operations Team",
    })

    await user.click(
      screen.getByRole("button", { name: /\+ Add Staff Member/ }),
    )
    await screen.findByRole("heading", { name: "Add Staff Member" })
    const form = screen
      .getByRole("button", { name: "Create & Assign Staff" })
      .closest("form") as HTMLFormElement

    await user.type(
      screen.getByPlaceholderText("e.g. abebe@grandskylight.com"),
      "bekele@luxstay.test",
    )
    await user.type(
      screen.getByPlaceholderText("Minimum 8 characters"),
      "secret123",
    )
    fireEvent.change(screen.getByPlaceholderText("e.g. Abebe Bekele"), {
      target: { value: "   " },
    })
    fireEvent.submit(form)

    expect(
      await screen.findByText("Please enter the staff member’s full name."),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText("e.g. Abebe Bekele"), {
      target: { value: "Bekele Wolde" },
    })
    fireEvent.change(screen.getByPlaceholderText("Minimum 8 characters"), {
      target: { value: "short" },
    })
    fireEvent.submit(form)

    expect(
      await screen.findByText("Password must be at least 8 characters long."),
    ).toBeInTheDocument()
  })

  it("assigns an existing staff account using a custom role", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Staff")
    await screen.findByRole("heading", {
      name: "Hotel Staff & Operations Team",
    })

    await user.click(
      screen.getByRole("button", { name: /\+ Add Staff Member/ }),
    )
    await screen.findByRole("heading", { name: "Add Staff Member" })
    await user.click(
      screen.getByRole("button", { name: "Assign Existing Staff by Email" }),
    )

    fireEvent.change(
      screen.getByPlaceholderText("e.g. staff.member@domain.com"),
      {
        target: { value: "existing@luxstay.test" },
      },
    )
    await user.click(screen.getByRole("button", { name: "Other" }))
    await user.type(
      screen.getByPlaceholderText(
        "Enter custom role (e.g. Concierge, Maintenance, Security, Chef...)",
      ),
      "Concierge",
    )

    await user.click(
      screen.getByRole("button", { name: "Assign Staff to Hotel" }),
    )

    await waitFor(() =>
      expect(mgr.assignStaff).toHaveBeenCalledWith("h1", {
        email: "existing@luxstay.test",
        role: "Concierge",
      }),
    )
    expect(
      await screen.findByText(
        "Staff member (Concierge) assigned to hotel successfully!",
      ),
    ).toBeInTheDocument()
  })

  it("requires an email when assigning existing staff", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Staff")
    await screen.findByRole("heading", {
      name: "Hotel Staff & Operations Team",
    })

    await user.click(
      screen.getByRole("button", { name: /\+ Add Staff Member/ }),
    )
    await screen.findByRole("heading", { name: "Add Staff Member" })
    await user.click(
      screen.getByRole("button", { name: "Assign Existing Staff by Email" }),
    )
    const form = screen
      .getByRole("button", { name: "Assign Staff to Hotel" })
      .closest("form") as HTMLFormElement

    fireEvent.submit(form)

    expect(
      await screen.findByText(
        "Please enter the email address of the staff member.",
      ),
    ).toBeInTheDocument()
    expect(mgr.assignStaff).not.toHaveBeenCalled()
  })

  it("toggles activation and removes a staff member", async () => {
    mgr.listStaff.mockResolvedValue({ data: [staffHana] })
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true)
    const user = userEvent.setup()
    await renderTab(user, "Staff")

    expect(await screen.findByText("Hana Girma")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Deactivate" }))
    await waitFor(() =>
      expect(mgr.updateStaffStatus).toHaveBeenCalledWith("h1", "u-s1", false),
    )
    expect(
      await screen.findByText("Staff account deactivated."),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Remove" }))
    await waitFor(() =>
      expect(mgr.removeStaff).toHaveBeenCalledWith("h1", "u-s1"),
    )
    expect(
      await screen.findByText("Hana Girma has been removed from this hotel."),
    ).toBeInTheDocument()
    expect(confirmSpy).toHaveBeenCalled()
  })

  it("reports staff creation failures", async () => {
    mgr.createStaff.mockRejectedValueOnce(new Error("duplicate email"))
    const user = userEvent.setup()
    await renderTab(user, "Staff")
    await screen.findByRole("heading", {
      name: "Hotel Staff & Operations Team",
    })

    await user.click(
      screen.getByRole("button", { name: /\+ Add Staff Member/ }),
    )
    await screen.findByRole("heading", { name: "Add Staff Member" })

    fireEvent.change(screen.getByPlaceholderText("e.g. Abebe Bekele"), {
      target: { value: "Bekele Wolde" },
    })
    fireEvent.change(
      screen.getByPlaceholderText("e.g. abebe@grandskylight.com"),
      {
        target: { value: "bekele@luxstay.test" },
      },
    )
    fireEvent.change(screen.getByPlaceholderText("Minimum 8 characters"), {
      target: { value: "secret123" },
    })
    await user.click(
      screen.getByRole("button", { name: "Create & Assign Staff" }),
    )

    expect(await screen.findByText("duplicate email")).toBeInTheDocument()
  })
})

describe("Reports tab", () => {
  it("renders KPI cards, preview table, and monthly revenue", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Reports")

    expect(
      await screen.findByRole("heading", { name: "Reports & Analytics" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Total Bookings")).toBeInTheDocument()
    expect(screen.getByText("Confirmed / Active")).toBeInTheDocument()
    expect(screen.getByText("Occupancy Rate")).toBeInTheDocument()
    expect(screen.getByText("62.0%")).toBeInTheDocument()
    expect(screen.getByText("Monthly Revenue Breakdown")).toBeInTheDocument()
    expect(screen.getByText("Oct 2026")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", {
        name: "Report Preview (Executive Overview — Monthly (30 Days))",
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByText("Skylight Hotel").length).toBeGreaterThan(0)
  })

  it("switches report categories and timeframes", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Reports")
    await screen.findByRole("heading", { name: "Reports & Analytics" })

    await user.click(screen.getByRole("button", { name: "Reservations" }))
    expect(
      await screen.findByRole("heading", {
        name: "Report Preview (Reservations — Monthly (30 Days))",
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByText("#LX-1001").length).toBeGreaterThan(0)
    expect(screen.getAllByText("#LX-1002").length).toBeGreaterThan(0)

    await user.click(screen.getByRole("button", { name: "Financial Revenue" }))
    expect(
      await screen.findByRole("heading", {
        name: "Report Preview (Financial Revenue — Monthly (30 Days))",
      }),
    ).toBeInTheDocument()
    expect(screen.getByText("Settled")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Room Occupancy" }))
    expect(
      await screen.findByRole("heading", {
        name: "Report Preview (Room Occupancy — Monthly (30 Days))",
      }),
    ).toBeInTheDocument()
    expect(screen.getByText("Room 101")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Guest Demographics" }))
    expect(
      await screen.findByRole("heading", {
        name: "Report Preview (Guest Demographics — Monthly (30 Days))",
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/abebe@example.com/).length).toBeGreaterThan(0)

    await user.click(screen.getByRole("button", { name: "Cancellations" }))
    expect(
      await screen.findByRole("heading", {
        name: "Report Preview (Cancellations — Monthly (30 Days))",
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Weekly (7 Days)" }))
    expect(
      await screen.findByRole("heading", {
        name: "Report Preview (Cancellations — Weekly (7 Days))",
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Executive Overview" }))
    expect(
      await screen.findByRole("heading", {
        name: "Report Preview (Executive Overview — Weekly (7 Days))",
      }),
    ).toBeInTheDocument()
  })

  it("downloads PDF and Excel statements", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Reports")
    await screen.findByRole("heading", { name: "Reports & Analytics" })

    await user.click(screen.getByRole("button", { name: "Download PDF" }))
    await waitFor(() =>
      expect(mgr.downloadReport).toHaveBeenCalledWith(
        "h1",
        "overview",
        "pdf",
        "monthly",
      ),
    )
    expect(
      await screen.findByText(
        "Downloaded Executive Overview PDF report for Skylight Hotel (Monthly (30 Days)).",
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Download Excel" }))
    await waitFor(() =>
      expect(mgr.downloadReport).toHaveBeenCalledWith(
        "h1",
        "overview",
        "excel",
        "monthly",
      ),
    )
    expect(
      await screen.findByText(
        "Downloaded Executive Overview Excel spreadsheet for Skylight Hotel (Monthly (30 Days)).",
      ),
    ).toBeInTheDocument()
  })

  it("reports report download failures", async () => {
    mgr.downloadReport.mockRejectedValueOnce(new Error("report backend down"))
    const user = userEvent.setup()
    await renderTab(user, "Reports")
    await screen.findByRole("heading", { name: "Reports & Analytics" })

    await user.click(screen.getByRole("button", { name: "Download PDF" }))

    expect(await screen.findByText("report backend down")).toBeInTheDocument()
  })
})
