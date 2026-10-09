import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import StaffPage from "@/app/staff/page"
import { useAuth } from "@/lib/auth-store"
import { managerApi } from "@/lib/services"
import type { User } from "@/lib/types"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/staff",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "x" }),
}))

jest.mock("@/lib/services", () => {
  const actual = jest.requireActual("@/lib/services")
  return {
    ...actual,
    managerApi: {
      ...actual.managerApi,
      bookings: jest.fn(),
      stats: jest.fn(),
      hotels: jest.fn(),
      getOperationalRooms: jest.fn(),
      updateRoomStatus: jest.fn(),
      action: jest.fn(),
      createWalkIn: jest.fn(),
      noShow: jest.fn(),
      listStayRequests: jest.fn(),
      decideStayRequest: jest.fn(),
      relocateRoom: jest.fn(),
    },
    paymentApi: { ...actual.paymentApi, markCashPaid: jest.fn() },
  }
})

const mgr = managerApi as unknown as Record<string, jest.Mock>

const staffUser: User = {
  id: "u-staff",
  email: "sam@luxstay.test",
  fullName: "Sam Tesfaye",
  role: "STAFF",
  isActive: true,
  createdAt: "2026-01-05T00:00:00.000Z",
}

const operationalRoom = (
  id: string,
  roomNumber: string,
  type: string,
  status: string,
  isOccupied = false,
) => ({
  id,
  roomNumber,
  type,
  capacity: 2,
  beds: 1,
  bathroom: 1,
  basePrice: 3500,
  status,
  amenities: [],
  hotelId: "h1",
  isOccupied,
  currentGuest: isOccupied ? "Girma Wolde" : null,
  currentGuestPhone: isOccupied ? "+251911000004" : null,
  currentBookingId: isOccupied ? "bk-occupied-00004" : null,
  currentBookingRef: isOccupied ? "A99314" : null,
  checkOutDate: isOccupied ? "2026-10-20T00:00:00.000Z" : null,
  checkOutDateNote: null,
  checkInDate: isOccupied ? "2026-10-10T00:00:00.000Z" : null,
})

const ROOMS = [
  operationalRoom("r101", "101", "SINGLE", "AVAILABLE"),
  operationalRoom("r102", "102", "DOUBLE", "CLEANING"),
  operationalRoom("r103", "103", "SUITE", "MAINTENANCE"),
  operationalRoom("r104", "104", "PRESIDENTIAL", "AVAILABLE", true),
  operationalRoom("r105", "105", "TWIN", "AVAILABLE"),
]

const hotel = (id: string, name: string) => ({
  id,
  name,
  description: "A central business hotel",
  address: "Bole Road, Addis Ababa",
  city: { id: "c1", name: "Addis Ababa", country: { name: "Ethiopia" } },
  starRating: 5,
  averageRating: 4.7,
  reviewCount: 210,
  status: "ACTIVE",
  lat: null,
  lng: null,
  images: [],
  amenities: [],
  rooms: [
    {
      id: "r101",
      roomNumber: "101",
      type: "SINGLE",
      capacity: 2,
      beds: 1,
      bathroom: 1,
      basePrice: 3500,
      status: "AVAILABLE",
      amenities: [],
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
})

const walkInScope = () =>
  screen
    .getByText("Front Desk Walk-In Check-In")
    .closest(".fixed") as HTMLElement

const renderHousekeeping = async () => {
  render(<StaffPage />)
  await screen.findByRole("heading", { name: "Front Desk Console" })
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Room Board" }))
  await screen.findByRole("heading", { name: "Housekeeping & Room Status" })
}

beforeEach(() => {
  localStorage.clear()
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => undefined)
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

  mgr.bookings.mockResolvedValue({ data: [] })
  mgr.stats.mockResolvedValue({
    pendingApprovals: 0,
    todaysCheckIns: 0,
    todaysCheckOuts: 0,
    activeGuests: 0,
  })
  mgr.hotels.mockResolvedValue([hotel("h1", "Skylight Hotel")])
  mgr.getOperationalRooms.mockResolvedValue(ROOMS)
  mgr.listStayRequests.mockResolvedValue([])
  mgr.updateRoomStatus.mockResolvedValue(undefined)
  mgr.action.mockResolvedValue(undefined)
  mgr.createWalkIn.mockResolvedValue(undefined)
  mgr.noShow.mockResolvedValue(undefined)
  mgr.decideStayRequest.mockResolvedValue(undefined)
  mgr.relocateRoom.mockResolvedValue(undefined)

  useAuth
    .getState()
    .setSession({ user: staffUser, accessToken: "at", refreshToken: "rt" })
})

describe("Staff housekeeping board controls", () => {
  it("labels every room type in the inventory", async () => {
    await renderHousekeeping()

    expect(screen.getByText("Room 101")).toBeInTheDocument()
    expect(screen.getByText("Single")).toBeInTheDocument()
    expect(screen.getByText("Double")).toBeInTheDocument()
    expect(screen.getByText("Suite")).toBeInTheDocument()
    expect(screen.getByText("Presidential")).toBeInTheDocument()
    expect(screen.getByText("TWIN")).toBeInTheDocument()
  }, 15000)

  it("walks the KPI counters through each status filter", async () => {
    const user = userEvent.setup()
    await renderHousekeeping()

    await user.click(
      screen.getByRole("button", { name: /Clean & ready for guests/ }),
    )
    expect(await screen.findByText("Room 101")).toBeInTheDocument()
    expect(screen.queryByText("Room 102")).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: /Housekeeping required/ }),
    )
    expect(await screen.findByText("Room 102")).toBeInTheDocument()
    expect(screen.queryByText("Room 101")).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: /Repair \/ Out of order/ }),
    )
    expect(await screen.findByText("Room 103")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: /Checked-in active guests/ }),
    )
    expect(await screen.findByText("Room 104")).toBeInTheDocument()
    expect(screen.getByText("#A99314")).toBeInTheDocument()
    expect(screen.getByText("Girma Wolde")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: /Total hotel inventory/ }),
    )
    expect(await screen.findByText("Room 105")).toBeInTheDocument()
  }, 15000)

  it("switches property from the board header and refreshes it", async () => {
    mgr.hotels.mockResolvedValue([
      hotel("h1", "Skylight Hotel"),
      hotel("h2", "Nile View Lodge"),
    ])
    const user = userEvent.setup()
    await renderHousekeeping()

    await user.click(
      screen.getByRole("button", {
        name: "Switch property, currently Skylight Hotel",
      }),
    )
    await user.click(
      await screen.findByRole("option", { name: /Nile View Lodge/ }),
    )
    await waitFor(() =>
      expect(mgr.getOperationalRooms).toHaveBeenCalledWith("h2"),
    )

    const before = mgr.getOperationalRooms.mock.calls.length
    await user.click(
      within(screen.getByRole("banner")).getByRole("button", {
        name: "Refresh",
      }),
    )
    await waitFor(() =>
      expect(mgr.getOperationalRooms.mock.calls.length).toBeGreaterThan(before),
    )
  }, 15000)

  it("returns a maintenance room to service", async () => {
    const user = userEvent.setup()
    await renderHousekeeping()

    await user.type(
      screen.getByPlaceholderText("Search room number, type, guest..."),
      "103",
    )
    await user.click(
      await screen.findByTitle("Mark room as clean and ready for arrivals"),
    )

    await waitFor(() =>
      expect(mgr.updateRoomStatus).toHaveBeenCalledWith("r103", "AVAILABLE"),
    )
    expect(
      await screen.findByText("Room status successfully updated to Available."),
    ).toBeInTheDocument()
  }, 15000)

  it("sends an available room to the housekeeping queue", async () => {
    const user = userEvent.setup()
    await renderHousekeeping()

    await user.type(
      screen.getByPlaceholderText("Search room number, type, guest..."),
      "101",
    )
    await user.click(
      await screen.findByTitle("Send room to housekeeping queue"),
    )

    await waitFor(() =>
      expect(mgr.updateRoomStatus).toHaveBeenCalledWith("r101", "CLEANING"),
    )
    expect(
      await screen.findByText("Room status successfully updated to Cleaning."),
    ).toBeInTheDocument()
  }, 15000)

  it("reports a rejected room status change", async () => {
    mgr.updateRoomStatus.mockRejectedValue(
      new Error("Housekeeping sync is offline"),
    )
    const user = userEvent.setup()
    await renderHousekeeping()

    await user.type(
      screen.getByPlaceholderText("Search room number, type, guest..."),
      "103",
    )
    await user.click(
      await screen.findByTitle("Mark room as clean and ready for arrivals"),
    )

    expect(
      await screen.findByText("Housekeeping sync is offline"),
    ).toBeInTheDocument()
  }, 15000)

  it("keeps the skeleton up while the room feed is still pending", async () => {
    mgr.getOperationalRooms.mockReturnValue(new Promise(() => undefined))
    render(<StaffPage />)
    await screen.findByRole("heading", { name: "Front Desk Console" })
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Room Board" }))
    await screen.findByRole("heading", { name: "Housekeeping & Room Status" })

    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    )
    expect(screen.queryByText("Room 101")).not.toBeInTheDocument()
  }, 15000)

  it("falls back to zeroed metrics when the stats feed fails", async () => {
    mgr.stats.mockRejectedValue(new Error("metrics down"))
    mgr.hotels.mockRejectedValue(new Error("catalog down"))
    render(<StaffPage />)

    expect(
      await screen.findByRole("heading", { name: "Front Desk Console" }),
    ).toBeInTheDocument()
    expect(screen.getAllByText("Occupancy").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Arrivals").length).toBeGreaterThan(0)
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(4)
    expect(mgr.getOperationalRooms).not.toHaveBeenCalled()
  }, 15000)

  it("shows the empty stay request feed when the request feed fails", async () => {
    mgr.listStayRequests.mockRejectedValue(new Error("requests down"))
    const user = userEvent.setup()
    render(<StaffPage />)
    await screen.findByRole("heading", { name: "Front Desk Console" })

    await user.click(screen.getByRole("button", { name: /^Stay Requests/ }))

    expect(
      await screen.findByText("No stay requests on file."),
    ).toBeInTheDocument()
  }, 15000)

  it("shows the empty board when the operational room feed fails", async () => {
    mgr.getOperationalRooms.mockRejectedValue(new Error("rooms down"))
    await renderHousekeeping()

    expect(await screen.findByText("No Rooms Found")).toBeInTheDocument()
    expect(
      screen.getByText(
        "No rooms match the selected operational status filter.",
      ),
    ).toBeInTheDocument()
  }, 15000)
})

describe("Staff walk-in form", () => {
  const openWalkIn = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: "+ Walk-In Guest" }))
    await screen.findByText("Front Desk Walk-In Check-In")
  }

  it("accepts the optional guest details before being dismissed", async () => {
    const user = userEvent.setup()
    render(<StaffPage />)
    await screen.findByRole("heading", { name: "Front Desk Console" })
    await openWalkIn(user)

    await user.type(
      screen.getByPlaceholderText("guest@example.com"),
      "guest@example.com",
    )
    await user.type(screen.getByPlaceholderText("ID-98765"), "ID-12345")
    fireEvent.change(document.querySelectorAll('input[type="date"]')[0], {
      target: { value: "2026-11-02" },
    })
    fireEvent.change(document.querySelectorAll('input[type="date"]')[1], {
      target: { value: "2026-11-06" },
    })
    await user.selectOptions(
      within(walkInScope()).getAllByRole("combobox")[1],
      "TELEBIRR",
    )
    await user.click(screen.getByRole("checkbox"))

    expect(screen.getByPlaceholderText("guest@example.com")).toHaveValue(
      "guest@example.com",
    )
    expect(screen.getByPlaceholderText("ID-98765")).toHaveValue("ID-12345")
    expect(screen.getByRole("checkbox")).not.toBeChecked()

    await user.click(screen.getByRole("button", { name: "Close" }))
    expect(
      screen.queryByText("Front Desk Walk-In Check-In"),
    ).not.toBeInTheDocument()

    await openWalkIn(user)
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(
      screen.queryByText("Front Desk Walk-In Check-In"),
    ).not.toBeInTheDocument()
    expect(mgr.createWalkIn).not.toHaveBeenCalled()
  }, 15000)

  it("ignores a submission that has no room picked yet", async () => {
    const user = userEvent.setup()
    render(<StaffPage />)
    await screen.findByRole("heading", { name: "Front Desk Console" })
    await openWalkIn(user)

    fireEvent.submit(walkInScope().querySelector("form") as HTMLFormElement)

    expect(mgr.createWalkIn).not.toHaveBeenCalled()
  }, 15000)

  it("reports a rejected walk-in registration", async () => {
    mgr.createWalkIn.mockRejectedValue(new Error("Room was just taken"))
    const user = userEvent.setup()
    render(<StaffPage />)
    await screen.findByRole("heading", { name: "Front Desk Console" })
    await openWalkIn(user)

    await user.type(
      screen.getByPlaceholderText("e.g. Almaz Ayana"),
      "Almaz Ayana",
    )
    await user.type(
      screen.getByPlaceholderText("+251 91 123 4567"),
      "+251911111111",
    )
    await user.selectOptions(
      within(walkInScope()).getAllByRole("combobox")[0],
      "r101",
    )
    await user.click(screen.getByRole("button", { name: "Check-In Guest" }))

    expect(await screen.findByText("Room was just taken")).toBeInTheDocument()
  }, 15000)
})
