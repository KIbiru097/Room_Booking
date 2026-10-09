import { render, screen, within } from "@testing-library/react"
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

const base = {
  hotelId: "h1",
  userId: "u-guest",
  checkIn: "2026-10-12T00:00:00.000Z",
  checkOut: "2026-10-14T00:00:00.000Z",
  totalPrice: 4200,
  createdAt: "2026-10-01T00:00:00.000Z",
}

const confirmedBooking = {
  ...base,
  id: "bk-confirmed-000002",
  status: "CONFIRMED",
  bookingRef: "LX-99313",
  user: { fullName: "Sara Bekele", email: "sara@example.com", phone: null },
  details: [
    {
      id: "d1",
      roomId: "r101",
      room: { id: "r101", roomNumber: "101", type: "SINGLE" },
    },
  ],
}

const checkedInBooking = {
  ...base,
  id: "bk-checkedin-00003",
  status: "CHECKED_IN",
  bookingRef: "LX-99314",
  user: {
    fullName: "Meron Tesfu",
    email: "meron@example.com",
    phone: "+251911000003",
  },
  details: [
    {
      id: "d2",
      roomId: "r101",
      room: { id: "r101", roomNumber: "101", type: "DELUXE" },
    },
  ],
}

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
  rooms: [
    {
      id: "r102",
      roomNumber: "102",
      type: "SUITE",
      capacity: 3,
      beds: 2,
      bathroom: 1,
      basePrice: 5200,
      status: "AVAILABLE",
      amenities: [],
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

const renderStaff = async () => {
  render(<StaffPage />)
  await screen.findByRole("heading", { name: "Front Desk Console" })
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

  mgr.bookings.mockResolvedValue({ data: [confirmedBooking, checkedInBooking] })
  mgr.stats.mockResolvedValue({
    pendingApprovals: 0,
    todaysCheckIns: 0,
    todaysCheckOuts: 0,
    activeGuests: 0,
  })
  mgr.hotels.mockResolvedValue([hotel])
  mgr.getOperationalRooms.mockResolvedValue([])
  mgr.listStayRequests.mockResolvedValue([])
  mgr.noShow.mockResolvedValue(undefined)
  mgr.relocateRoom.mockResolvedValue(undefined)
  mgr.action.mockResolvedValue(undefined)

  useAuth
    .getState()
    .setSession({ user: staffUser, accessToken: "at", refreshToken: "rt" })
})

describe("StaffDashboardPage dialog failures", () => {
  it("surfaces a rejected no-show and clears the notice", async () => {
    mgr.noShow.mockRejectedValue(new Error("Guest already checked out"))
    const user = userEvent.setup()
    await renderStaff()

    await user.click(screen.getAllByRole("button", { name: "No-Show" })[0])
    await screen.findByRole("heading", { name: "Confirm Guest No-Show" })
    await user.click(screen.getByRole("button", { name: "Confirm No-Show" }))

    expect(
      await screen.findByText("Guest already checked out"),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    )
    expect(
      screen.queryByText("Guest already checked out"),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Confirm Guest No-Show" }),
    ).toBeInTheDocument()
  }, 15000)

  it("surfaces a rejected relocation", async () => {
    mgr.relocateRoom.mockRejectedValue(
      new Error("Target room is reserved tonight"),
    )
    const user = userEvent.setup()
    await renderStaff()

    await user.click(screen.getByRole("button", { name: "Relocate" }))
    const heading = await screen.findByRole("heading", {
      name: "Room Relocation",
    })
    const modal = within(heading.closest(".fixed") as HTMLElement)
    await user.selectOptions(modal.getByRole("combobox"), "r102")
    await user.click(modal.getByRole("button", { name: "Confirm Relocation" }))

    expect(
      await screen.findByText("Target room is reserved tonight"),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Room Relocation" }),
    ).toBeInTheDocument()
  }, 15000)
})
