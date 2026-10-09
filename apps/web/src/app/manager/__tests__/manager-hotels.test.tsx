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
      addHotelImages: jest.fn(),
      setPrimaryHotelImage: jest.fn(),
      removeHotelImage: jest.fn(),
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
  amenities: ["Pool", "WiFi"],
  rooms: [],
  _count: { rooms: 8, bookings: 4 },
}

const ethiopia = { id: "et", name: "Ethiopia", code: "ET" }

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
  mgr.bookings.mockResolvedValue({ data: [] })
  mgr.stats.mockResolvedValue({
    pendingApprovals: 0,
    todaysCheckIns: 1,
    todaysCheckOuts: 0,
    activeGuests: 2,
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
  mgr.addHotelImages.mockResolvedValue(undefined)
  mgr.setPrimaryHotelImage.mockResolvedValue(undefined)
  mgr.removeHotelImage.mockResolvedValue(undefined)
  mgr.downloadReport.mockResolvedValue(undefined)
  cat.countries.mockResolvedValue([])
  cat.cities.mockResolvedValue([])
  cat.getById.mockResolvedValue({ ...hotel, rooms: [] })

  useAuth
    .getState()
    .setSession({ user: managerUser, accessToken: "at", refreshToken: "rt" })
})

const openHotelsTab = async (user: ReturnType<typeof userEvent.setup>) => {
  render(<ManagerPage />)
  await screen.findByRole("heading", { name: "Manager Overview" })
  await user.click(screen.getByRole("button", { name: "Hotels" }))
  await screen.findByRole("heading", { name: "My Hotels" })
}

describe("Hotels tab", () => {
  it("renders the managed property card and jumps to other tabs", async () => {
    const user = userEvent.setup()
    await openHotelsTab(user)

    expect(screen.getAllByText("Skylight Hotel").length).toBeGreaterThan(1)
    expect(screen.getByText("Addis Ababa")).toBeInTheDocument()
    expect(screen.getByText("Active")).toBeInTheDocument()
    expect(screen.getByText("5 Stars")).toBeInTheDocument()
    expect(screen.getByText("8 rooms")).toBeInTheDocument()
    expect(screen.getByText("4 bookings")).toBeInTheDocument()
    expect(screen.getByText("1 managed properties")).toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "Rooms" })[1])
    expect(
      await screen.findByRole("heading", { name: "Room Inventory" }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Hotels" }))
    await screen.findByRole("heading", { name: "My Hotels" })
    await user.click(screen.getAllByRole("button", { name: "Policies" })[1])
    expect(
      await screen.findByRole("heading", { name: "Hotel Policies & Rules" }),
    ).toBeInTheDocument()
  })

  it("creates a new hotel with a chosen city", async () => {
    cat.countries.mockResolvedValue([ethiopia])
    cat.cities.mockResolvedValue([{ id: "c2", name: "Bahir Dar" }])
    const user = userEvent.setup()
    await openHotelsTab(user)

    await user.click(screen.getByRole("button", { name: "+ New Hotel" }))
    expect(
      await screen.findByRole("heading", { name: "Create Hotel" }),
    ).toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText("e.g. Grand Palace Hotel"),
      "Grand Palace Hotel",
    )
    await user.type(
      screen.getByPlaceholderText("e.g. Bole Road, House 104"),
      "Ring Road 12",
    )
    fireEvent.change(screen.getByDisplayValue("Choose city…"), {
      target: { value: "c2" },
    })

    await user.click(screen.getByRole("button", { name: "Create Hotel" }))

    await waitFor(() =>
      expect(mgr.createHotel).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Grand Palace Hotel",
          address: "Ring Road 12",
          description: null,
          starRating: 4,
          status: "ACTIVE",
          cityId: "c2",
        }),
      ),
    )
    expect(
      await screen.findByText("Hotel created successfully!"),
    ).toBeInTheDocument()
  })

  it("creates a hotel using a free-text city name", async () => {
    const user = userEvent.setup()
    await openHotelsTab(user)

    await user.click(screen.getByRole("button", { name: "+ New Hotel" }))
    await screen.findByRole("heading", { name: "Create Hotel" })

    await user.type(
      screen.getByPlaceholderText("e.g. Grand Palace Hotel"),
      "Harar View Hotel",
    )
    await user.type(
      screen.getByPlaceholderText("e.g. Bole Road, House 104"),
      "Ras Teghine 4",
    )
    await user.type(screen.getByPlaceholderText("City name"), "Harar")
    await user.type(
      screen.getByPlaceholderText("Pool, Spa, High-Speed WiFi, Valet Parking"),
      "Pool, WiFi",
    )

    await user.click(screen.getByRole("button", { name: "Create Hotel" }))

    await waitFor(() =>
      expect(mgr.createHotel).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Harar View Hotel",
          cityName: "Harar",
          amenities: ["Pool", "WiFi"],
        }),
      ),
    )
  })

  it("keeps the create button disabled until required fields are filled", async () => {
    const user = userEvent.setup()
    await openHotelsTab(user)

    await user.click(screen.getByRole("button", { name: "+ New Hotel" }))
    await screen.findByRole("heading", { name: "Create Hotel" })

    const submit = screen.getByRole("button", { name: "Create Hotel" })
    expect(submit).toBeDisabled()

    await user.type(
      screen.getByPlaceholderText("e.g. Grand Palace Hotel"),
      "Grand Palace Hotel",
    )
    expect(submit).toBeDisabled()

    await user.type(
      screen.getByPlaceholderText("e.g. Bole Road, House 104"),
      "Ring Road 12",
    )
    expect(submit).toBeEnabled()
    expect(mgr.createHotel).not.toHaveBeenCalled()
  })

  it("reports city loading failures inside the hotel form", async () => {
    cat.countries.mockResolvedValue([ethiopia])
    cat.cities.mockRejectedValueOnce(new Error("offline"))
    const user = userEvent.setup()
    await openHotelsTab(user)

    await user.click(screen.getByRole("button", { name: "+ New Hotel" }))

    expect(
      await screen.findByText("Unable to load cities for this country."),
    ).toBeInTheDocument()
  })

  it("edits the existing hotel and updates its details", async () => {
    const user = userEvent.setup()
    await openHotelsTab(user)

    await user.click(screen.getByRole("button", { name: "Edit" }))
    expect(
      await screen.findByRole("heading", { name: "Edit Hotel" }),
    ).toBeInTheDocument()
    expect(screen.getAllByDisplayValue("Skylight Hotel")).toHaveLength(2)
    expect(
      screen.getByDisplayValue("Bole Road, Addis Ababa"),
    ).toBeInTheDocument()
    expect(
      screen.getByDisplayValue("Central business hotel"),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue("Active"), {
      target: { value: "INACTIVE" },
    })
    await user.click(screen.getByRole("button", { name: "Save Changes" }))

    await waitFor(() =>
      expect(mgr.updateHotel).toHaveBeenCalledWith(
        "h1",
        expect.objectContaining({
          name: "Skylight Hotel",
          status: "INACTIVE",
          starRating: 5,
        }),
      ),
    )
    expect(
      await screen.findByText("Hotel details updated!"),
    ).toBeInTheDocument()
  })

  it("reports hotel save failures", async () => {
    mgr.updateHotel.mockRejectedValueOnce(new Error("duplicate hotel name"))
    const user = userEvent.setup()
    await openHotelsTab(user)

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await screen.findByRole("heading", { name: "Edit Hotel" })
    await user.click(screen.getByRole("button", { name: "Save Changes" }))

    expect(await screen.findByText("duplicate hotel name")).toBeInTheDocument()
  })

  it("closes the hotel form without saving", async () => {
    const user = userEvent.setup()
    await openHotelsTab(user)

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await screen.findByRole("heading", { name: "Edit Hotel" })
    await user.click(screen.getAllByRole("button", { name: "Cancel" })[0])

    expect(
      screen.queryByRole("heading", { name: "Edit Hotel" }),
    ).not.toBeInTheDocument()
    expect(mgr.updateHotel).not.toHaveBeenCalled()
  })
})

describe("Hotel photo management", () => {
  const images = [
    { id: "img1", url: "https://cdn.test/one.jpg", isPrimary: false },
    { id: "img2", url: "https://cdn.test/two.jpg", isPrimary: true },
  ]

  it("promotes and removes photos", async () => {
    mgr.hotels.mockResolvedValue([{ ...hotel, images }])
    const user = userEvent.setup()
    await openHotelsTab(user)

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await screen.findByRole("heading", { name: "Edit Hotel" })

    expect(screen.getByText("Property Photos")).toBeInTheDocument()
    expect(screen.getByText("2 photos")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Set as Primary" }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole("button", { name: "Delete Photo" }),
    ).toHaveLength(2)

    await user.click(screen.getByRole("button", { name: "Set as Primary" }))
    await waitFor(() =>
      expect(mgr.setPrimaryHotelImage).toHaveBeenCalledWith("h1", "img1"),
    )
    expect(
      await screen.findByText("Primary photo updated!"),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole("button", { name: "Delete Photo" }),
    ).toHaveLength(2)

    await user.click(screen.getAllByRole("button", { name: "Delete Photo" })[0])
    await waitFor(() =>
      expect(mgr.removeHotelImage).toHaveBeenCalledWith("h1", "img1"),
    )
    expect(
      await screen.findByText("Photo removed successfully."),
    ).toBeInTheDocument()
    expect(screen.getByText("1 photo")).toBeInTheDocument()
    expect(
      screen.getAllByRole("button", { name: "Delete Photo" }),
    ).toHaveLength(1)
  })

  it("uploads photos through the hidden file input", async () => {
    cat.getById.mockResolvedValue({ ...hotel, images: [], rooms: [] })
    mgr.addHotelImages.mockResolvedValue([
      { id: "img9", url: "https://cdn.test/nine.jpg", isPrimary: true },
    ])
    const user = userEvent.setup()
    await openHotelsTab(user)

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await screen.findByRole("heading", { name: "Edit Hotel" })

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    const file = new File(["binary"], "lobby.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() =>
      expect(mgr.addHotelImages).toHaveBeenCalledWith("h1", [expect.any(File)]),
    )
    expect(
      await screen.findByText("1 photo uploaded successfully!"),
    ).toBeInTheDocument()
    expect(screen.getByText("1 photo")).toBeInTheDocument()
  })

  it("reports photo upload failures", async () => {
    mgr.addHotelImages.mockRejectedValueOnce(new Error("image too large"))
    const user = userEvent.setup()
    await openHotelsTab(user)

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await screen.findByRole("heading", { name: "Edit Hotel" })

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    const file = new File(["binary"], "huge.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(await screen.findByText("image too large")).toBeInTheDocument()
  })

  it("reports photo action failures", async () => {
    mgr.setPrimaryHotelImage.mockRejectedValueOnce(new Error("storage denied"))
    mgr.hotels.mockResolvedValue([{ ...hotel, images }])
    const user = userEvent.setup()
    await openHotelsTab(user)

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await screen.findByRole("heading", { name: "Edit Hotel" })
    await user.click(screen.getByRole("button", { name: "Set as Primary" }))

    expect(await screen.findByText("storage denied")).toBeInTheDocument()
  })
})
