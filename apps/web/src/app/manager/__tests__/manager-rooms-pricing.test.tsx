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
      noShow: jest.fn(),
      createWalkIn: jest.fn(),
      decideStayRequest: jest.fn(),
      relocateRoom: jest.fn(),
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
  amenities: ["WiFi", "TV"],
  description: "Corner suite",
  status: "AVAILABLE",
  seasonalPricing: [
    {
      id: "sp1",
      name: "Irreecha Peak",
      startDate: "2026-10-01",
      endDate: "2026-10-07",
      priceMultiplier: 1.5,
      fixedPrice: null,
    },
  ],
}

const room102 = {
  id: "r2",
  hotelId: "h1",
  roomNumber: "102",
  type: "SUITE",
  capacity: 4,
  beds: 2,
  bathroom: 1,
  basePrice: 7200,
  amenities: ["WiFi"],
  description: "",
  status: "CLEANING",
  seasonalPricing: [
    {
      id: "sp2",
      name: "Early Bird",
      startDate: "2026-11-01",
      endDate: "2026-11-15",
      fixedPrice: 6000,
    },
  ],
}

const rooms = [room101, room102]

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
  mgr.noShow.mockResolvedValue(undefined)
  mgr.createWalkIn.mockResolvedValue(undefined)
  mgr.decideStayRequest.mockResolvedValue(undefined)
  mgr.relocateRoom.mockResolvedValue(undefined)
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
  mgr.upsertPolicy.mockResolvedValue({
    id: "p1",
    hotelId: "h1",
    checkInTime: "14:00",
    checkOutTime: "11:00",
  })
  mgr.createHotel.mockResolvedValue(undefined)
  mgr.updateHotel.mockResolvedValue(undefined)
  mgr.createStaff.mockResolvedValue(undefined)
  mgr.assignStaff.mockResolvedValue(undefined)
  mgr.updateStaffStatus.mockResolvedValue(undefined)
  mgr.removeStaff.mockResolvedValue(undefined)
  mgr.downloadReport.mockResolvedValue(undefined)
  cat.countries.mockResolvedValue([])
  cat.cities.mockResolvedValue([])
  cat.getById.mockResolvedValue({ ...hotel, rooms })

  useAuth
    .getState()
    .setSession({ user: managerUser, accessToken: "at", refreshToken: "rt" })
})

const goToTab = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) => {
  render(<ManagerPage />)
  await screen.findByRole("heading", { name: "Manager Overview" })
  await user.click(screen.getByRole("button", { name }))
}

describe("Rooms tab", () => {
  it("lists configured rooms and creates a new room", async () => {
    const user = userEvent.setup()
    await goToTab(user, "Rooms")

    expect(
      await screen.findByRole("heading", { name: "Room Inventory" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Room #101")).toBeInTheDocument()
    expect(screen.getByText("Room #102")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "+ Add Room" }))
    expect(
      await screen.findByRole("heading", { name: "Create Room" }),
    ).toBeInTheDocument()

    const roomNumber = screen.getByPlaceholderText("e.g. 101")
    await user.clear(roomNumber)
    await user.type(roomNumber, "210")

    const priceInput = screen.getByDisplayValue("1500")
    await user.clear(priceInput)
    await user.type(priceInput, "2500")

    await user.click(screen.getByRole("button", { name: "Save Room" }))

    await waitFor(() =>
      expect(mgr.createRoom).toHaveBeenCalledWith(
        "h1",
        expect.objectContaining({
          roomNumber: "210",
          type: "DELUXE",
          capacity: 2,
          beds: 1,
          bathroom: 1,
          basePrice: 2500,
          amenities: ["WiFi", "TV", "AC"],
        }),
      ),
    )
    expect(await screen.findByText("Room 210 created!")).toBeInTheDocument()
  })

  it("edits an existing room and reports the update", async () => {
    const user = userEvent.setup()
    await goToTab(user, "Rooms")
    await screen.findByRole("heading", { name: "Room Inventory" })

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0])
    expect(
      await screen.findByRole("heading", { name: "Edit Room 101" }),
    ).toBeInTheDocument()

    const priceInput = screen.getByDisplayValue("4500")
    await user.clear(priceInput)
    await user.type(priceInput, "4900")

    await user.click(screen.getByRole("button", { name: "Save Room" }))

    await waitFor(() =>
      expect(mgr.updateRoom).toHaveBeenCalledWith(
        "r1",
        expect.objectContaining({
          roomNumber: "101",
          basePrice: 4900,
          description: "Corner suite",
        }),
      ),
    )
    expect(await screen.findByText("Room 101 updated!")).toBeInTheDocument()
  })

  it("deletes a room after confirmation and skips when cancelled", async () => {
    const user = userEvent.setup()
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true)
    await goToTab(user, "Rooms")
    await screen.findByRole("heading", { name: "Room Inventory" })

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0])

    await waitFor(() => expect(mgr.deleteRoom).toHaveBeenCalledWith("r1"))
    expect(await screen.findByText("Room deleted.")).toBeInTheDocument()

    confirmSpy.mockReturnValue(false)
    await user.click(screen.getAllByRole("button", { name: "Delete" })[1])

    await waitFor(() => expect(mgr.deleteRoom).toHaveBeenCalledTimes(1))
  })

  it("surfaces room creation failures", async () => {
    const user = userEvent.setup()
    mgr.createRoom.mockRejectedValueOnce(new Error("inventory full"))
    await goToTab(user, "Rooms")
    await screen.findByRole("heading", { name: "Room Inventory" })

    await user.click(screen.getByRole("button", { name: "+ Add Room" }))
    await screen.findByRole("heading", { name: "Create Room" })
    await user.type(screen.getByPlaceholderText("e.g. 101"), "310")
    await user.click(screen.getByRole("button", { name: "Save Room" }))

    expect(await screen.findByText("inventory full")).toBeInTheDocument()
  })
})

describe("Pricing tab", () => {
  it("shows active pricing rules with multiplier and fixed price cells", async () => {
    const user = userEvent.setup()
    await goToTab(user, "Pricing")

    expect(
      await screen.findByRole("heading", { name: "Seasonal Dynamic Pricing" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Irreecha Peak")).toBeInTheDocument()
    expect(screen.getByText("1.5x multiplier")).toBeInTheDocument()
    expect(screen.getByText("Early Bird")).toBeInTheDocument()
    expect(screen.getByText("2 Active Rules")).toBeInTheDocument()
  })

  it("creates a seasonal pricing rule from the modal", async () => {
    const user = userEvent.setup()
    await goToTab(user, "Pricing")
    await screen.findByRole("heading", { name: "Seasonal Dynamic Pricing" })

    await user.click(screen.getByRole("button", { name: "+ Add Pricing Rule" }))
    expect(
      await screen.findAllByRole("heading", {
        name: "Seasonal Dynamic Pricing",
      }),
    ).toHaveLength(2)

    const nameInput = screen.getByPlaceholderText("e.g. Festival Season Surge")
    await user.clear(nameInput)
    await user.type(nameInput, "Genna Surge")

    const fixed = screen.getByPlaceholderText("e.g. 2500")
    await user.type(fixed, "9000")

    await user.click(screen.getByRole("button", { name: "Save Rule" }))

    await waitFor(() =>
      expect(mgr.upsertSeasonalPricing).toHaveBeenCalledWith(
        "r1",
        expect.objectContaining({
          name: "Genna Surge",
          priceMultiplier: 1.25,
          fixedPrice: 9000,
        }),
      ),
    )
    expect(
      await screen.findByText("Seasonal pricing rule established!"),
    ).toBeInTheDocument()
  })

  it("removes a pricing rule", async () => {
    const user = userEvent.setup()
    await goToTab(user, "Pricing")
    await screen.findByRole("heading", { name: "Seasonal Dynamic Pricing" })

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0])

    await waitFor(() =>
      expect(mgr.deleteSeasonalPricing).toHaveBeenCalledWith("r1", "sp1"),
    )
    expect(await screen.findByText("Pricing rule removed.")).toBeInTheDocument()
    await waitFor(() => expect(cat.getById).toHaveBeenCalledTimes(2))
  })

  it("shows the empty state when no seasonal rules exist", async () => {
    cat.getById.mockResolvedValue({
      ...hotel,
      rooms: [{ ...room101, seasonalPricing: [] }],
    })
    const user = userEvent.setup()
    await goToTab(user, "Pricing")

    expect(
      await screen.findByText(
        /No active seasonal pricing rules configured for this hotel yet/,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("0 Active Rules")).toBeInTheDocument()
  })

  it("reports seasonal pricing failures", async () => {
    const user = userEvent.setup()
    mgr.upsertSeasonalPricing.mockRejectedValueOnce(new Error("bad window"))
    await goToTab(user, "Pricing")
    await screen.findByRole("heading", { name: "Seasonal Dynamic Pricing" })

    await user.click(screen.getByRole("button", { name: "+ Add Pricing Rule" }))
    await screen.findAllByRole("heading", { name: "Seasonal Dynamic Pricing" })
    await user.click(screen.getByRole("button", { name: "Save Rule" }))

    expect(await screen.findByText("bad window")).toBeInTheDocument()
  })
})

describe("Availability tab", () => {
  it("renders room turnover rows and flips a room back to available", async () => {
    const user = userEvent.setup()
    await goToTab(user, "Availability")

    expect(
      await screen.findByRole("heading", {
        name: "Availability & Maintenance",
      }),
    ).toBeInTheDocument()
    expect(screen.getByText("Room #101")).toBeInTheDocument()
    expect(screen.getByText("Room #102")).toBeInTheDocument()
    expect(screen.getByText(/Total Inventory:/)).toBeInTheDocument()

    const availableButtons = screen.getAllByRole("button", {
      name: "Available",
    })
    await user.click(availableButtons[1])

    await waitFor(() =>
      expect(mgr.updateRoomStatus).toHaveBeenCalledWith("r2", "AVAILABLE"),
    )
    expect(
      await screen.findByText("Room status updated to Available."),
    ).toBeInTheDocument()
  })

  it("blocks a room for maintenance through the modal", async () => {
    const user = userEvent.setup()
    await goToTab(user, "Availability")
    await screen.findByRole("heading", { name: "Availability & Maintenance" })

    await user.click(
      screen.getByRole("button", { name: "+ Block Maintenance" }),
    )
    expect(
      await screen.findByRole("heading", {
        name: "Block Room for Maintenance",
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Apply Block" }))

    await waitFor(() =>
      expect(mgr.blockMaintenance).toHaveBeenCalledWith(
        expect.objectContaining({
          roomId: "r1",
          reason: "Plumbing / HVAC maintenance",
        }),
      ),
    )
    expect(
      await screen.findByText("Room marked for maintenance block."),
    ).toBeInTheDocument()
  })

  it("reports room status failures", async () => {
    const user = userEvent.setup()
    mgr.updateRoomStatus.mockRejectedValueOnce(new Error("lock failed"))
    await goToTab(user, "Availability")
    await screen.findByRole("heading", { name: "Availability & Maintenance" })

    const availableButtons = screen.getAllByRole("button", {
      name: "Available",
    })
    await user.click(availableButtons[1])

    expect(await screen.findByText("lock failed")).toBeInTheDocument()
  })

  it("shows the empty inventory hint when no rooms are configured", async () => {
    cat.getById.mockResolvedValue({ ...hotel, rooms: [] })
    const user = userEvent.setup()
    await goToTab(user, "Availability")

    expect(
      await screen.findByText(
        "No rooms configured for this hotel yet. Please add rooms in the Rooms tab first.",
      ),
    ).toBeInTheDocument()
  })
})

describe("Policies tab", () => {
  it("saves updated policy values", async () => {
    const user = userEvent.setup()
    await goToTab(user, "Policies")

    expect(
      await screen.findByRole("heading", { name: "Hotel Policies & Rules" }),
    ).toBeInTheDocument()

    const checkInInput = screen.getByDisplayValue("14:00")
    fireEvent.change(checkInInput, { target: { value: "15:30" } })

    await user.click(screen.getByRole("button", { name: "Save Policies" }))

    await waitFor(() =>
      expect(mgr.upsertPolicy).toHaveBeenCalledWith(
        "h1",
        expect.objectContaining({ checkInTime: "15:30" }),
      ),
    )
    expect(
      await screen.findByText("Hotel policy rules updated successfully!"),
    ).toBeInTheDocument()
  })

  it("reports policy save failures", async () => {
    const user = userEvent.setup()
    mgr.upsertPolicy.mockRejectedValueOnce(new Error("policy rejected"))
    await goToTab(user, "Policies")
    await screen.findByRole("heading", { name: "Hotel Policies & Rules" })

    await user.click(screen.getByRole("button", { name: "Save Policies" }))

    expect(await screen.findByText("policy rejected")).toBeInTheDocument()
  })
})
