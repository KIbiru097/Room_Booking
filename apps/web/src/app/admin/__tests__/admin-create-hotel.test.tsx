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
  role: "MANAGER",
  isActive: true,
  createdAt: "2026-02-01T00:00:00.000Z",
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

const openModal = async () => {
  const user = userEvent.setup()
  render(<AdminPage />)
  await screen.findByRole("heading", { name: "Platform Operations" })
  await user.click(screen.getByRole("button", { name: "Hotels" }))
  await screen.findByRole("heading", { name: "Hotel Properties & Approvals" })
  await user.click(screen.getByRole("button", { name: "Add Hotel" }))
  await screen.findByRole("heading", { name: "Add New Hotel Property" })
  return user
}

const fillValidBase = () => {
  fireEvent.change(
    screen.getByPlaceholderText("e.g. Ethiopian Skylight Hotel"),
    {
      target: { value: "Ras Hotel" },
    },
  )
  fireEvent.change(
    screen.getByPlaceholderText("e.g. Airport Road, Bole Sub-City"),
    {
      target: { value: "Airport Road, Bole Sub-City" },
    },
  )
  fireEvent.change(
    screen.getByPlaceholderText(
      "Enter an inviting description of the hotel property, key amenities, and surrounding highlights...",
    ),
    {
      target: {
        value: "A centrally located business hotel with full amenities.",
      },
    },
  )
}

const form = () =>
  screen
    .getByRole("button", { name: "Create Hotel" })
    .closest("form") as HTMLElement

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
    userCount: 2,
    hotelCount: 1,
    bookingCount: 0,
    totalRevenue: 0,
  })
  adm.occupancy.mockResolvedValue({
    rooms: 8,
    occupiedRoomsToday: 2,
    occupancyRate: 0.25,
    breakdown: [],
  })
  adm.users.mockResolvedValue({ data: [managerAccount] })
  adm.hotels.mockResolvedValue({ data: [] })
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

describe("Create hotel modal", () => {
  it("validates the required property fields", async () => {
    const user = await openModal()

    fireEvent.submit(form())
    expect(
      await screen.findByText("Hotel name must be at least 2 characters."),
    ).toBeInTheDocument()

    fireEvent.change(
      screen.getByPlaceholderText("e.g. Ethiopian Skylight Hotel"),
      {
        target: { value: "R" },
      },
    )
    fireEvent.submit(form())
    expect(
      await screen.findByText("Hotel name must be at least 2 characters."),
    ).toBeInTheDocument()

    fillValidBase()
    fireEvent.change(screen.getByDisplayValue("Addis Ababa"), {
      target: { value: "" },
    })
    fireEvent.submit(form())
    expect(
      await screen.findByText(
        "Please select a valid city for the hotel location.",
      ),
    ).toBeInTheDocument()

    const citySelect = screen.getByDisplayValue("-- Select City --")
    fireEvent.change(citySelect, { target: { value: "ci-addis" } })
    fireEvent.change(
      screen.getByPlaceholderText("e.g. Airport Road, Bole Sub-City"),
      {
        target: { value: "AB" },
      },
    )
    fireEvent.submit(form())
    expect(
      await screen.findByText("Street address must be at least 3 characters."),
    ).toBeInTheDocument()

    fireEvent.change(
      screen.getByPlaceholderText("e.g. Airport Road, Bole Sub-City"),
      {
        target: { value: "Airport Road, Bole Sub-City" },
      },
    )
    fireEvent.change(
      screen.getByPlaceholderText(
        "Enter an inviting description of the hotel property, key amenities, and surrounding highlights...",
      ),
      { target: { value: "short" } },
    )
    fireEvent.submit(form())
    expect(
      await screen.findByText(
        "Please provide a descriptive overview of at least 10 characters.",
      ),
    ).toBeInTheDocument()

    expect(adm.createHotel).not.toHaveBeenCalled()
    expect(user).toBeTruthy()
  })

  it("switches country and resets the city selection", async () => {
    await openModal()

    const countrySelect = screen.getByDisplayValue("Ethiopia (ET)")
    fireEvent.change(countrySelect, { target: { value: "ct-et" } })
    expect(screen.getByDisplayValue("Addis Ababa")).toBeInTheDocument()

    fillValidBase()
    fireEvent.change(screen.getByDisplayValue("Addis Ababa"), {
      target: { value: "ci-bah" },
    })
    expect(screen.getByDisplayValue("Bahir Dar")).toBeInTheDocument()
  })

  it("creates a hotel with an existing manager account", async () => {
    adm.createHotel.mockResolvedValueOnce({ id: "h-created" })
    const user = await openModal()

    fillValidBase()
    fireEvent.change(screen.getByDisplayValue("Addis Ababa"), {
      target: { value: "ci-addis" },
    })
    fireEvent.change(screen.getByDisplayValue("4 Stars ★★★★"), {
      target: { value: "5" },
    })
    fireEvent.change(
      screen.getByDisplayValue("ACTIVE (Published Immediately & Bookable)"),
      { target: { value: "PENDING_APPROVAL" } },
    )
    fireEvent.change(
      screen.getByDisplayValue("-- Unassigned (Assign Later) --"),
      { target: { value: "u-mgr" } },
    )

    await user.click(screen.getByRole("button", { name: "Create Hotel" }))

    await waitFor(() =>
      expect(adm.createHotel).toHaveBeenCalledWith({
        name: "Ras Hotel",
        description: "A centrally located business hotel with full amenities.",
        cityId: "ci-addis",
        address: "Airport Road, Bole Sub-City",
        starRating: 5,
        status: "PENDING_APPROVAL",
        managerId: "u-mgr",
      }),
    )
    expect(adm.createUser).not.toHaveBeenCalled()
    expect(
      await screen.findByText(
        'Hotel property "Ras Hotel" created and listed successfully!',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Add New Hotel Property" }),
    ).not.toBeInTheDocument()
  })

  it("validates the brand new manager credentials before creating", async () => {
    const user = await openModal()

    fillValidBase()
    fireEvent.change(screen.getByDisplayValue("Addis Ababa"), {
      target: { value: "ci-addis" },
    })
    await user.click(
      screen.getByRole("button", { name: "+ Create New Manager" }),
    )

    fireEvent.submit(form())
    expect(
      await screen.findByText(
        "New manager full name must be at least 2 characters.",
      ),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText("e.g. Dawit Haile"), {
      target: { value: "Dawit" },
    })
    fireEvent.change(screen.getByPlaceholderText("manager@hotel.com"), {
      target: { value: "nope" },
    })
    fireEvent.submit(form())
    expect(
      await screen.findByText(
        "Please provide a valid work email address for the new manager.",
      ),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText("manager@hotel.com"), {
      target: { value: "dawit@luxstay.test" },
    })
    fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), {
      target: { value: "short" },
    })
    fireEvent.submit(form())
    expect(
      await screen.findByText(
        "Manager account password must be at least 8 characters.",
      ),
    ).toBeInTheDocument()

    expect(adm.createHotel).not.toHaveBeenCalled()
    expect(adm.createUser).not.toHaveBeenCalled()
  })

  it("provisions a new manager and uploads photos in one flow", async () => {
    adm.createUser.mockResolvedValueOnce({
      id: "u-mgr-new",
      role: "MANAGER",
      fullName: "Dawit Haile",
    })
    adm.createHotel.mockResolvedValueOnce({ id: "h-new-1" })
    const user = await openModal()

    fillValidBase()
    fireEvent.change(screen.getByDisplayValue("Addis Ababa"), {
      target: { value: "ci-addis" },
    })
    await user.click(
      screen.getByRole("button", { name: "+ Create New Manager" }),
    )

    fireEvent.change(screen.getByPlaceholderText("e.g. Dawit Haile"), {
      target: { value: "Dawit Haile" },
    })
    fireEvent.change(screen.getByPlaceholderText("manager@hotel.com"), {
      target: { value: "DAWIT@Luxstay.TEST" },
    })

    await user.click(screen.getByRole("button", { name: "Generate Password" }))
    const passwordInput = screen.getByPlaceholderText("Min. 8 characters")
    expect(passwordInput).toHaveAttribute("type", "text")
    expect(
      (passwordInput as HTMLInputElement).value.length,
    ).toBeGreaterThanOrEqual(8)

    await user.click(screen.getByRole("button", { name: "Hide password" }))
    expect(passwordInput).toHaveAttribute("type", "password")
    await user.click(screen.getByRole("button", { name: "Show password" }))
    expect(passwordInput).toHaveAttribute("type", "text")

    fireEvent.change(screen.getByPlaceholderText("+251 91 123 4567"), {
      target: { value: "+251911000222" },
    })

    const file = new File(["png"], "lobby.png", { type: "image/png" })
    const fileInput = document.getElementById(
      "admin-hotel-photos",
    ) as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })
    expect(screen.getByText("lobby.png")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Create Hotel" }))

    await waitFor(() =>
      expect(adm.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Dawit Haile",
          email: "dawit@luxstay.test",
          role: "MANAGER",
          phone: "+251911000222",
        }),
      ),
    )
    await waitFor(() =>
      expect(adm.createHotel).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Ras Hotel", managerId: "u-mgr-new" }),
      ),
    )
    await waitFor(() =>
      expect(adm.addHotelImages).toHaveBeenCalledWith("h-new-1", [file]),
    )

    expect(
      await screen.findByText(
        /Hotel "Ras Hotel" created and new Manager account provisioned for "Dawit Haile"/,
      ),
    ).toBeInTheDocument()
  })

  it("keeps the modal open when creation fails", async () => {
    adm.createHotel.mockRejectedValueOnce(new Error("city lookup failed"))
    const user = await openModal()

    fillValidBase()
    fireEvent.change(screen.getByDisplayValue("Addis Ababa"), {
      target: { value: "ci-addis" },
    })

    await user.click(screen.getByRole("button", { name: "Create Hotel" }))

    expect(await screen.findByText("city lookup failed")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Add New Hotel Property" }),
    ).toBeInTheDocument()
    expect(adm.addHotelImages).not.toHaveBeenCalled()
  })

  it("cancels the modal without creating anything", async () => {
    const user = await openModal()

    fillValidBase()
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(
      screen.queryByRole("heading", { name: "Add New Hotel Property" }),
    ).not.toBeInTheDocument()
    expect(adm.createHotel).not.toHaveBeenCalled()
  })

  it("warns when countries fail to load and still blocks creation", async () => {
    hotelsApi.countries.mockRejectedValueOnce(new Error("geo service down"))
    const user = await openModal()

    fillValidBase()
    fireEvent.submit(form())

    expect(
      await screen.findByText(
        "Please select a valid city for the hotel location.",
      ),
    ).toBeInTheDocument()
    expect(adm.createHotel).not.toHaveBeenCalled()
    expect(user).toBeTruthy()
  })
})
