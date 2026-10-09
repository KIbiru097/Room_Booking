import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import StaffPage from "@/app/staff/page"
import { useAuth } from "@/lib/auth-store"
import { managerApi, paymentApi } from "@/lib/services"
import type { User } from "@/lib/types"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
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
const pay = paymentApi as unknown as Record<string, jest.Mock>

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

const pendingBooking = {
  ...base,
  id: "bk-pending-00000001",
  status: "PENDING",
  bookingRef: "LX-99312",
  user: {
    fullName: "Abebe Kebede",
    email: "abebe@example.com",
    phone: "+251911000001",
  },
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

const stayRequest = {
  id: "sr-1",
  bookingId: "bk-pending-00000001",
  type: "EARLY_CHECK_IN",
  requestedTime: "11:00",
  status: "PENDING",
  createdAt: "2026-10-01T00:00:00.000Z",
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
      id: "r101",
      roomNumber: "101",
      type: "DELUXE",
      capacity: 2,
      beds: 1,
      bathroom: 1,
      basePrice: 3500,
      status: "AVAILABLE",
      amenities: [],
    },
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
  mockPush.mockClear()
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

  mgr.bookings.mockResolvedValue({
    data: [pendingBooking, confirmedBooking, checkedInBooking],
  })
  mgr.stats.mockResolvedValue({
    pendingApprovals: 3,
    todaysCheckIns: 5,
    todaysCheckOuts: 2,
    activeGuests: 7,
  })
  mgr.hotels.mockResolvedValue([hotel])
  mgr.getOperationalRooms.mockResolvedValue([])
  mgr.listStayRequests.mockResolvedValue([stayRequest])
  mgr.action.mockResolvedValue(undefined)
  mgr.decideStayRequest.mockResolvedValue(undefined)
  mgr.createWalkIn.mockResolvedValue(undefined)
  mgr.updateRoomStatus.mockResolvedValue(undefined)
  mgr.noShow.mockResolvedValue(undefined)
  mgr.relocateRoom.mockResolvedValue(undefined)
  pay.markCashPaid.mockResolvedValue(undefined)

  useAuth
    .getState()
    .setSession({ user: staffUser, accessToken: "at", refreshToken: "rt" })
})

describe("StaffDashboardPage arrival board actions", () => {
  it("rejects a pending reservation", async () => {
    const user = userEvent.setup()
    await renderStaff()

    await user.click(screen.getByRole("button", { name: "Reject" }))

    await waitFor(() =>
      expect(mgr.action).toHaveBeenCalledWith("bk-pending-00000001", "reject"),
    )
    expect(
      await screen.findByText("Reservation marked as rejected."),
    ).toBeInTheDocument()
  }, 15000)

  it("checks a confirmed guest in from the arrivals board", async () => {
    const user = userEvent.setup()
    await renderStaff()

    await user.click(screen.getAllByRole("button", { name: "Check In" })[0])

    await waitFor(() =>
      expect(mgr.action).toHaveBeenCalledWith(
        "bk-confirmed-000002",
        "check-in",
      ),
    )
    expect(
      await screen.findByText("Reservation marked as checked-in."),
    ).toBeInTheDocument()
  }, 15000)

  it("checks a guest out from the arrivals board", async () => {
    const user = userEvent.setup()
    await renderStaff()

    await user.click(screen.getByRole("button", { name: "Check Out" }))

    await waitFor(() =>
      expect(mgr.action).toHaveBeenCalledWith(
        "bk-checkedin-00003",
        "check-out",
      ),
    )
    expect(
      await screen.findByText("Reservation marked as checked-out."),
    ).toBeInTheDocument()
  }, 15000)

  it("opens the no-show warning and backs out of it", async () => {
    const user = userEvent.setup()
    await renderStaff()

    await user.click(screen.getAllByRole("button", { name: "No-Show" })[0])

    expect(
      await screen.findByRole("heading", { name: "Confirm Guest No-Show" }),
    ).toBeInTheDocument()
    expect(screen.getByText("LX-99313")).toBeInTheDocument()
    expect(screen.getByText("Room 101 (Single)")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(
      screen.queryByRole("heading", { name: "Confirm Guest No-Show" }),
    ).not.toBeInTheDocument()
    expect(mgr.noShow).not.toHaveBeenCalled()
  }, 15000)

  it("marks a confirmed reservation as a no-show", async () => {
    const user = userEvent.setup()
    await renderStaff()

    await user.click(screen.getAllByRole("button", { name: "No-Show" })[0])
    await screen.findByRole("heading", { name: "Confirm Guest No-Show" })
    await user.click(screen.getByRole("button", { name: "Confirm No-Show" }))

    await waitFor(() =>
      expect(mgr.noShow).toHaveBeenCalledWith("bk-confirmed-000002"),
    )
    expect(
      await screen.findByText(
        "Booking LX-99313 successfully marked as No-Show. Room availability has been restored.",
      ),
    ).toBeInTheDocument()
  }, 15000)

  it("relocates a checked-in guest into the free suite", async () => {
    const user = userEvent.setup()
    await renderStaff()

    await user.click(screen.getByRole("button", { name: "Relocate" }))

    expect(
      await screen.findByRole("heading", { name: "Room Relocation" }),
    ).toBeInTheDocument()
    await user.selectOptions(screen.getByRole("combobox"), "r102")
    const reason = screen.getByDisplayValue("Front desk room transfer")
    await user.clear(reason)
    await user.type(reason, "Guest upgraded for anniversary")
    await user.click(screen.getByRole("button", { name: "Confirm Relocation" }))

    await waitFor(() =>
      expect(mgr.relocateRoom).toHaveBeenCalledWith("bk-checkedin-00003", {
        oldRoomId: "r101",
        newRoomId: "r102",
        reason: "Guest upgraded for anniversary",
      }),
    )
    expect(
      await screen.findByText("Guest room transfer complete!"),
    ).toBeInTheDocument()
  }, 15000)

  it("closes the relocation dialog without moving anyone", async () => {
    const user = userEvent.setup()
    await renderStaff()

    await user.click(screen.getByRole("button", { name: "Relocate" }))
    const heading = await screen.findByRole("heading", {
      name: "Room Relocation",
    })
    await user.click(
      within(heading.closest(".fixed") as HTMLElement).getAllByRole(
        "button",
      )[0],
    )
    expect(
      screen.queryByRole("heading", { name: "Room Relocation" }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Relocate" }))
    await screen.findByRole("heading", { name: "Room Relocation" })
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(
      screen.queryByRole("heading", { name: "Room Relocation" }),
    ).not.toBeInTheDocument()
    expect(mgr.relocateRoom).not.toHaveBeenCalled()
  }, 15000)

  it("reports a rejected front desk action and clears the notice", async () => {
    mgr.action.mockRejectedValue(new Error("Backend rejected the transition"))
    const user = userEvent.setup()
    await renderStaff()

    await user.click(screen.getByRole("button", { name: "Reject" }))

    expect(
      await screen.findByText("Backend rejected the transition"),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    )
    expect(
      screen.queryByText("Backend rejected the transition"),
    ).not.toBeInTheDocument()
  }, 15000)

  it("records cash on the arrivals board", async () => {
    const user = userEvent.setup()
    await renderStaff()

    await user.click(screen.getAllByRole("button", { name: "Cash Paid" })[0])

    await waitFor(() =>
      expect(pay.markCashPaid).toHaveBeenCalledWith(
        "bk-pending-00000001",
        "Front desk cash collection",
      ),
    )
    expect(
      await screen.findByText("Payment recorded as SUCCEEDED (Cash)."),
    ).toBeInTheDocument()
  }, 15000)

  it("dismisses the success notice once it has been read", async () => {
    const user = userEvent.setup()
    await renderStaff()

    await user.click(screen.getByRole("button", { name: "Reject" }))
    await screen.findByText("Reservation marked as rejected.")
    await user.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    )

    expect(
      screen.queryByText("Reservation marked as rejected."),
    ).not.toBeInTheDocument()
  }, 15000)

  it("reloads the board from the refresh shortcut", async () => {
    const user = userEvent.setup()
    await renderStaff()
    const before = mgr.bookings.mock.calls.length

    await user.click(
      within(screen.getByRole("banner")).getByRole("button", {
        name: "Refresh",
      }),
    )

    await waitFor(() =>
      expect(mgr.bookings.mock.calls.length).toBeGreaterThan(before),
    )
  }, 15000)

  it("follows the room board navigation into the room board", async () => {
    const user = userEvent.setup()
    await renderStaff()

    await user.click(screen.getByRole("button", { name: "Room Board" }))

    expect(
      await screen.findByRole("heading", {
        name: "Housekeeping & Room Status",
      }),
    ).toBeInTheDocument()
  }, 15000)

  it("opens the full reservation list", async () => {
    const user = userEvent.setup()
    await renderStaff()

    await user.click(screen.getByRole("button", { name: "View All (3) →" }))

    expect(
      await screen.findByRole("heading", { name: "Front Desk Reservations" }),
    ).toBeInTheDocument()
    expect(screen.getByText("3 reservations recorded")).toBeInTheDocument()
  }, 15000)

  it("checks a guest out from the reservation list", async () => {
    const user = userEvent.setup()
    await renderStaff()
    await user.click(screen.getByRole("button", { name: "Bookings" }))
    await screen.findByRole("heading", { name: "Front Desk Reservations" })

    await user.click(screen.getByRole("button", { name: "Check Out" }))

    await waitFor(() =>
      expect(mgr.action).toHaveBeenCalledWith(
        "bk-checkedin-00003",
        "check-out",
      ),
    )
  }, 15000)

  it("reports a rejected cash collection from the reservation list", async () => {
    pay.markCashPaid.mockRejectedValue(
      new Error("Ledger is locked for this shift"),
    )
    const user = userEvent.setup()
    await renderStaff()
    await user.click(screen.getByRole("button", { name: "Bookings" }))
    await screen.findByRole("heading", { name: "Front Desk Reservations" })

    await user.click(
      screen.getAllByRole("button", { name: "Mark Cash Paid" })[0],
    )

    expect(
      await screen.findByText("Ledger is locked for this shift"),
    ).toBeInTheDocument()
  }, 15000)

  it("opens the walk-in form from the reservation list", async () => {
    const user = userEvent.setup()
    await renderStaff()
    await user.click(screen.getByRole("button", { name: "Bookings" }))
    await screen.findByRole("heading", { name: "Front Desk Reservations" })

    await user.click(screen.getByRole("button", { name: "+ Walk-In Guest" }))

    expect(
      await screen.findByText("Front Desk Walk-In Check-In"),
    ).toBeInTheDocument()
  }, 15000)

  it("signs the staff member out of the console", async () => {
    const user = userEvent.setup()
    await renderStaff()

    await user.click(screen.getByRole("button", { name: /Sam Tesfaye/ }))
    await screen.findAllByRole("heading", { name: "Profile" })
    await user.click(screen.getByRole("button", { name: "Sign out" }))

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"))
    expect(useAuth.getState().user).toBeNull()
  }, 15000)
})

describe("StaffDashboardPage stay request decisions", () => {
  it("rejects a request and shows the decided states", async () => {
    mgr.listStayRequests.mockResolvedValue([
      stayRequest,
      { ...stayRequest, id: "sr-2", status: "APPROVED" },
      {
        ...stayRequest,
        id: "sr-3",
        type: "LATE_CHECK_OUT",
        status: "REJECTED",
      },
    ])
    const user = userEvent.setup()
    await renderStaff()

    await user.click(screen.getByRole("button", { name: /^Stay Requests/ }))
    await screen.findByRole("heading", { name: "Guest Stay Requests" })
    expect(screen.getAllByText("Approved")).toHaveLength(1)
    expect(screen.getAllByText("Rejected")).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: "Decide" }))
    await screen.findByRole("heading", { name: "Decide Stay Request" })
    await user.click(screen.getByRole("button", { name: "Reject" }))

    await waitFor(() =>
      expect(mgr.decideStayRequest).toHaveBeenCalledWith("sr-1", {
        decision: "REJECTED",
        decisionNote: undefined,
      }),
    )
    expect(
      await screen.findByText("Stay request rejected!"),
    ).toBeInTheDocument()
  }, 15000)

  it("closes the decision dialog from the header button", async () => {
    const user = userEvent.setup()
    await renderStaff()
    await user.click(screen.getByRole("button", { name: /^Stay Requests/ }))
    await screen.findByRole("heading", { name: "Guest Stay Requests" })
    await user.click(screen.getByRole("button", { name: "Decide" }))

    const heading = await screen.findByRole("heading", {
      name: "Decide Stay Request",
    })
    await user.click(
      within(heading.closest(".fixed") as HTMLElement).getAllByRole(
        "button",
      )[0],
    )

    expect(
      screen.queryByRole("heading", { name: "Decide Stay Request" }),
    ).not.toBeInTheDocument()
    expect(mgr.decideStayRequest).not.toHaveBeenCalled()
  }, 15000)

  it("reports a rejected decision", async () => {
    mgr.decideStayRequest.mockRejectedValue(
      new Error("Stay request already handled"),
    )
    const user = userEvent.setup()
    await renderStaff()
    await user.click(screen.getByRole("button", { name: /^Stay Requests/ }))
    await screen.findByRole("heading", { name: "Guest Stay Requests" })
    await user.click(screen.getByRole("button", { name: "Decide" }))
    await screen.findByRole("heading", { name: "Decide Stay Request" })

    await user.click(screen.getByRole("button", { name: "Approve" }))

    expect(
      await screen.findByText("Stay request already handled"),
    ).toBeInTheDocument()
  }, 15000)
})
