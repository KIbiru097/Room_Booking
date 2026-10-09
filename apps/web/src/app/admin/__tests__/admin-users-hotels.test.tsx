import { fireEvent, render, screen, waitFor } from "@testing-library/react"
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

const managerAccount = {
  id: "u-mgr",
  email: "miki@luxstay.test",
  fullName: "Miki Alemu",
  phone: "+251911000002",
  role: "MANAGER",
  isActive: true,
  createdAt: "2026-02-01T00:00:00.000Z",
}

const inactiveAccount = {
  id: "u-cst",
  email: "hanna@luxstay.test",
  fullName: "Hanna Girma",
  role: "CUSTOMER",
  isActive: false,
  createdAt: "2026-03-01T00:00:00.000Z",
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

const countriesFixture = [
  {
    id: "ct-et",
    code: "ET",
    name: "Ethiopia",
    cities: [
      { id: "ci-addis", name: "Addis Ababa" },
      { id: "ci-bah", name: "Bahir Dar" },
    ],
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
  adm.users.mockResolvedValue({ data: [managerAccount, inactiveAccount] })
  adm.hotels.mockResolvedValue({ data: [pendingHotel, activeHotel] })
  adm.bookings.mockResolvedValue({ data: [] })
  adm.payments.mockResolvedValue({ data: [] })
  adm.reviews.mockResolvedValue({ data: [] })
  adm.auditLogs.mockResolvedValue([])
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
  hotelsApi.countries.mockResolvedValue(countriesFixture)

  useAuth
    .getState()
    .setSession({ user: adminUser, accessToken: "at", refreshToken: "rt" })
})

describe("Users tab", () => {
  it("creates a manager account from the create user modal", async () => {
    adm.createUser.mockResolvedValueOnce({
      id: "u-new",
      fullName: "Dawit Haile",
      role: "STAFF",
      email: "dawit@example.com",
      isActive: true,
      createdAt: "2026-10-01T00:00:00.000Z",
    })
    const user = await renderTab("Users", "User Accounts")

    await user.click(
      screen.getByRole("button", { name: /Create Manager \/ User/ }),
    )
    expect(
      await screen.findByRole("heading", { name: "Create User Account" }),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText("e.g. Dawit Tadesse"), {
      target: { value: "Dawit Haile" },
    })
    fireEvent.change(screen.getByPlaceholderText("manager@luxstay.com"), {
      target: { value: "DAWIT@Example.COM" },
    })
    fireEvent.change(screen.getByPlaceholderText("Minimum 6 characters"), {
      target: { value: "secret123" },
    })
    fireEvent.change(screen.getByPlaceholderText("+251 91 234 5678"), {
      target: { value: "+251911223344" },
    })
    fireEvent.change(
      screen.getByDisplayValue("Manager (Hotel General Manager)"),
      {
        target: { value: "STAFF" },
      },
    )
    fireEvent.change(screen.getByDisplayValue("-- No Hotel Assigned --"), {
      target: { value: "h-active" },
    })

    await user.click(screen.getByRole("button", { name: "Create Account" }))

    await waitFor(() =>
      expect(adm.createUser).toHaveBeenCalledWith({
        fullName: "Dawit Haile",
        email: "dawit@example.com",
        password: "secret123",
        phone: "+251911223344",
        role: "STAFF",
        hotelId: "h-active",
      }),
    )
    expect(
      await screen.findByText(
        'Account for Dawit Haile (Staff) created successfully and assigned to manage "Nile View Lodge"!',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Create User Account" }),
    ).not.toBeInTheDocument()
  })

  it("reports create user failures in the modal", async () => {
    adm.createUser.mockRejectedValueOnce(new Error("email already registered"))
    const user = await renderTab("Users", "User Accounts")

    await user.click(
      screen.getByRole("button", { name: /Create Manager \/ User/ }),
    )
    await screen.findByRole("heading", { name: "Create User Account" })

    fireEvent.change(screen.getByPlaceholderText("e.g. Dawit Tadesse"), {
      target: { value: "Abebe" },
    })
    fireEvent.change(screen.getByPlaceholderText("manager@luxstay.com"), {
      target: { value: "abebe@luxstay.test" },
    })
    fireEvent.change(screen.getByPlaceholderText("Minimum 6 characters"), {
      target: { value: "secret123" },
    })
    await user.click(screen.getByRole("button", { name: "Create Account" }))

    expect(
      await screen.findByText("email already registered"),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Create User Account" }),
    ).toBeInTheDocument()
  })

  it("toggles password visibility and closes the create user modal", async () => {
    const user = await renderTab("Users", "User Accounts")

    await user.click(
      screen.getByRole("button", { name: /Create Manager \/ User/ }),
    )
    await screen.findByRole("heading", { name: "Create User Account" })

    const password = screen.getByPlaceholderText("Minimum 6 characters")
    expect(password).toHaveAttribute("type", "password")

    await user.click(screen.getByRole("button", { name: "Show password" }))
    expect(password).toHaveAttribute("type", "text")

    await user.click(screen.getByRole("button", { name: "Hide password" }))
    expect(password).toHaveAttribute("type", "password")

    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(
      screen.queryByRole("heading", { name: "Create User Account" }),
    ).not.toBeInTheDocument()
  })

  it("restores an inactive account and surfaces status failures", async () => {
    const user = await renderTab("Users", "User Accounts")

    await user.click(screen.getAllByRole("button", { name: "Restore" })[0])
    await waitFor(() =>
      expect(adm.setUserActive).toHaveBeenCalledWith("u-cst", true),
    )
    expect(
      await screen.findByText("User Hanna Girma restored."),
    ).toBeInTheDocument()

    adm.setUserActive.mockRejectedValueOnce(new Error("account locked"))
    await user.click(screen.getAllByRole("button", { name: "Suspend" })[0])
    expect(await screen.findByText("account locked")).toBeInTheDocument()
  })

  it("shows the empty state when no users match", async () => {
    adm.users.mockResolvedValue({ data: [] })
    const user = await renderTab("Users", "User Accounts")

    expect(
      await screen.findByText(
        "No users matching the selected filter or search term.",
      ),
    ).toBeInTheDocument()
    expect(user).toBeTruthy()
  })
})

describe("Hotels tab modals", () => {
  it("rejects a pending hotel with a typed reason", async () => {
    const user = await renderTab("Hotels", "Hotel Properties & Approvals")

    await user.click(screen.getByRole("button", { name: "Reject" }))
    expect(
      await screen.findByRole("heading", { name: "Reject Hotel Listing" }),
    ).toBeInTheDocument()

    const confirm = screen.getByRole("button", { name: "Confirm Rejection" })
    expect(confirm).toBeDisabled()

    fireEvent.change(
      screen.getByPlaceholderText(/Missing commercial operating license/),
      {
        target: { value: "Missing operating license" },
      },
    )
    expect(confirm).toBeEnabled()

    await user.click(confirm)

    await waitFor(() =>
      expect(adm.rejectHotel).toHaveBeenCalledWith(
        "h-pending",
        "Missing operating license",
      ),
    )
    expect(
      await screen.findByText("Hotel Skylight Suites rejected."),
    ).toBeInTheDocument()
  })

  it("reports reject hotel failures", async () => {
    adm.rejectHotel.mockRejectedValueOnce(new Error("policy rejected"))
    const user = await renderTab("Hotels", "Hotel Properties & Approvals")

    await user.click(screen.getByRole("button", { name: "Reject" }))
    await screen.findByRole("heading", { name: "Reject Hotel Listing" })
    fireEvent.change(
      screen.getByPlaceholderText(/Missing commercial operating license/),
      {
        target: { value: "Bad photos" },
      },
    )
    await user.click(screen.getByRole("button", { name: "Confirm Rejection" }))

    expect(await screen.findByText("policy rejected")).toBeInTheDocument()
  })

  it("suspends and reactivates hotels through the status toggle", async () => {
    const user = await renderTab("Hotels", "Hotel Properties & Approvals")

    await user.click(
      screen.getAllByRole("button", { name: "Suspend / Deactivate" })[0],
    )
    await waitFor(() =>
      expect(adm.setHotelStatus).toHaveBeenCalledWith("h-active", "INACTIVE"),
    )
    expect(
      await screen.findByText("Hotel status updated to inactive."),
    ).toBeInTheDocument()

    adm.setHotelStatus.mockRejectedValueOnce(new Error("action refused"))
    await user.click(
      screen.getAllByRole("button", { name: "Suspend / Deactivate" })[0],
    )
    expect(await screen.findByText("action refused")).toBeInTheDocument()
  })

  it("approves a hotel and reports approval failures", async () => {
    adm.approveHotel.mockRejectedValueOnce(new Error("lock failed"))
    const user = await renderTab("Hotels", "Hotel Properties & Approvals")

    await user.click(screen.getByRole("button", { name: "Approve" }))

    expect(await screen.findByText("lock failed")).toBeInTheDocument()
  })

  it("assigns a manager to the unassigned hotel", async () => {
    const user = await renderTab("Hotels", "Hotel Properties & Approvals")

    await user.click(screen.getByRole("button", { name: "Assign" }))
    expect(
      await screen.findByRole("heading", { name: "Assign General Manager" }),
    ).toBeInTheDocument()

    const save = screen.getByRole("button", { name: "Save Assignment" })
    expect(save).toBeDisabled()

    fireEvent.change(screen.getByDisplayValue("-- Choose an account --"), {
      target: { value: "u-mgr" },
    })
    expect(save).toBeEnabled()

    await user.click(save)

    await waitFor(() =>
      expect(adm.reassignManager).toHaveBeenCalledWith("h-pending", "u-mgr"),
    )
    expect(
      await screen.findByText(
        'Hotel "Skylight Suites" manager updated to Miki Alemu!',
      ),
    ).toBeInTheDocument()
  })

  it("reports assign manager failures and closes via cancel", async () => {
    adm.reassignManager.mockRejectedValueOnce(
      new Error("role elevation denied"),
    )
    const user = await renderTab("Hotels", "Hotel Properties & Approvals")

    await user.click(screen.getByRole("button", { name: "Assign" }))
    await screen.findByRole("heading", { name: "Assign General Manager" })

    fireEvent.change(screen.getByDisplayValue("-- Choose an account --"), {
      target: { value: "u-mgr" },
    })
    await user.click(screen.getByRole("button", { name: "Save Assignment" }))
    expect(await screen.findByText("role elevation denied")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(
      screen.queryByRole("heading", { name: "Assign General Manager" }),
    ).not.toBeInTheDocument()
  })

  it("opens the reassign modal from a hotel that already has a manager", async () => {
    const user = await renderTab("Hotels", "Hotel Properties & Approvals")

    await user.click(screen.getByRole("button", { name: "Change Manager" }))
    expect(
      await screen.findByRole("heading", { name: "Assign General Manager" }),
    ).toBeInTheDocument()
    expect(
      screen.getByDisplayValue(/Miki Alemu \(miki@luxstay.test\)/),
    ).toBeInTheDocument()
  })

  it("filters hotels and shows the empty result state", async () => {
    const user = await renderTab("Hotels", "Hotel Properties & Approvals")

    await user.click(screen.getByRole("button", { name: /^Suspended/ }))
    expect(
      await screen.findByText("No hotels match your filters"),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /^All Hotels/ }))
    fireEvent.change(
      screen.getByPlaceholderText("Search hotels by name, city, address..."),
      {
        target: { value: "zzz" },
      },
    )
    expect(
      await screen.findByText("No hotels match your filters"),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "×" }))
    expect(await screen.findByText("Skylight Suites")).toBeInTheDocument()
  })

  it("shows the onboarding empty state when no hotels exist", async () => {
    adm.hotels.mockResolvedValue({ data: [] })
    const user = await renderTab("Hotels", "Hotel Properties & Approvals")

    expect(
      await screen.findByText("No hotel properties listed"),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Add New Hotel" }))
    expect(
      await screen.findByRole("heading", { name: "Add New Hotel Property" }),
    ).toBeInTheDocument()
  })
})
