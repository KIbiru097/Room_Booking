import { render, screen, waitFor } from "@testing-library/react"
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
  status: string,
  isOccupied = false,
) => ({
  id,
  roomNumber,
  type: "DELUXE",
  capacity: 2,
  beds: 1,
  bathroom: 1,
  basePrice: 3500,
  status,
  amenities: [],
  hotelId: "h1",
  isOccupied,
  currentGuest: isOccupied ? "Girma Wolde" : null,
  currentGuestPhone: null,
  currentBookingId: null,
  currentBookingRef: null,
  checkInDate: null,
  checkOutDate: null,
})

const room101 = operationalRoom("r101", "101", "AVAILABLE")
const room102 = operationalRoom("r102", "102", "CLEANING")
const room103 = operationalRoom("r103", "103", "MAINTENANCE")

const hotel = {
  id: "h1",
  name: "Skylight Hotel",
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
  rooms: [room101],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

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
  mgr.hotels.mockResolvedValue([hotel])
  mgr.getOperationalRooms.mockResolvedValue([room101, room102, room103])
  mgr.listStayRequests.mockResolvedValue([])
  mgr.updateRoomStatus.mockResolvedValue(undefined)
  mgr.action.mockResolvedValue(undefined)
  mgr.createWalkIn.mockResolvedValue(undefined)

  useAuth
    .getState()
    .setSession({ user: staffUser, accessToken: "at", refreshToken: "rt" })
})

describe("Staff housekeeping board", () => {
  it("lists operational rooms with status badges and KPI filters", async () => {
    await renderHousekeeping()

    expect(screen.getByText("Room 101")).toBeInTheDocument()
    expect(screen.getByText("Room 102")).toBeInTheDocument()
    expect(screen.getByText("Room 103")).toBeInTheDocument()
    expect(screen.getAllByText("Ready").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Cleaning").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Maintenance").length).toBeGreaterThan(0)
    expect(
      screen.getByRole("button", { name: "Available" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Occupied" })).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("Search room number, type, guest..."),
    ).toBeInTheDocument()
    expect(screen.getByText("Filter:")).toBeInTheDocument()
  }, 15000)

  it("filters the board by search text and clears the filter again", async () => {
    const user = userEvent.setup()
    await renderHousekeeping()

    await user.type(
      screen.getByPlaceholderText("Search room number, type, guest..."),
      "zzz",
    )

    expect(await screen.findByText("No Rooms Found")).toBeInTheDocument()
    expect(screen.getByText('No rooms match "zzz".')).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Clear Filters" }))

    expect(await screen.findByText("Room 101")).toBeInTheDocument()
    expect(screen.getByText("Room 103")).toBeInTheDocument()
  }, 15000)

  it("shows the filtered empty state when a status has no rooms", async () => {
    const user = userEvent.setup()
    await renderHousekeeping()

    await user.click(screen.getByRole("button", { name: "Occupied" }))

    expect(await screen.findByText("No Rooms Found")).toBeInTheDocument()
    expect(
      screen.getByText(
        "No rooms match the selected operational status filter.",
      ),
    ).toBeInTheDocument()
  }, 15000)

  it("marks a room as needing maintenance through the manager API", async () => {
    const user = userEvent.setup()
    await renderHousekeeping()

    await user.type(
      screen.getByPlaceholderText("Search room number, type, guest..."),
      "101",
    )
    await user.click(await screen.findByRole("button", { name: "Repair" }))

    await waitFor(() =>
      expect(mgr.updateRoomStatus).toHaveBeenCalledWith("r101", "MAINTENANCE"),
    )
    expect(
      await screen.findByText(
        "Room status successfully updated to Maintenance.",
      ),
    ).toBeInTheDocument()
  }, 15000)

  it("registers a walk-in guest with the selected room", async () => {
    const user = userEvent.setup()
    render(<StaffPage />)
    await screen.findByRole("heading", { name: "Front Desk Console" })

    await user.click(screen.getByRole("button", { name: "+ Walk-In Guest" }))
    expect(
      await screen.findByText("Front Desk Walk-In Check-In"),
    ).toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText("e.g. Almaz Ayana"),
      "Almaz Ayana",
    )
    await user.type(
      screen.getByPlaceholderText("+251 91 123 4567"),
      "+251911111111",
    )
    await user.selectOptions(screen.getAllByRole("combobox")[0], "r101")

    const submit = screen.getByRole("button", { name: "Check-In Guest" })
    expect(submit).toBeEnabled()
    await user.click(submit)

    await waitFor(() =>
      expect(mgr.createWalkIn).toHaveBeenCalledWith(
        expect.objectContaining({
          hotelId: "h1",
          roomIds: ["r101"],
          guestName: "Almaz Ayana",
          guestPhone: "+251911111111",
          paymentMethod: "CASH",
          paidImmediately: true,
        }),
      ),
    )
    expect(
      await screen.findByText("Walk-in guest registered & checked in!"),
    ).toBeInTheDocument()
  }, 15000)
})
