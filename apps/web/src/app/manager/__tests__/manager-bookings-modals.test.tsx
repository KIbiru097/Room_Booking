import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ManagerPage from "@/app/manager/page"
import { useAuth } from "@/lib/auth-store"
import { managerApi, hotelApi, paymentApi } from "@/lib/services"
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
      respondToReview: jest.fn(),
      deleteReviewResponse: jest.fn(),
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
const pay = paymentApi as unknown as Record<string, jest.Mock>
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

const availableRoom = {
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

const pendingBooking = {
  id: "bk-pending-00000001",
  userId: "u-guest",
  hotelId: "h1",
  checkIn: "2026-10-12T00:00:00.000Z",
  checkOut: "2026-10-14T00:00:00.000Z",
  status: "PENDING",
  totalPrice: 4200,
  createdAt: "2026-10-01T00:00:00.000Z",
  bookingRef: "LX-99312",
  user: {
    fullName: "Abebe Kebede",
    email: "abebe@example.com",
    phone: "+251911000001",
  },
}

const confirmedBooking = {
  ...pendingBooking,
  id: "bk-confirmed-00000002",
  bookingRef: "LX-99313",
  status: "CONFIRMED",
  details: [
    {
      id: "d1",
      roomId: "r1",
      room: { id: "r1", roomNumber: "101", type: "DELUXE" },
    },
  ],
  user: {
    fullName: "Sara Bekele",
    email: "sara@example.com",
    phone: "+251911000002",
  },
}

const checkedInBooking = {
  ...pendingBooking,
  id: "bk-checkedin-0000004",
  bookingRef: "LX-99314",
  status: "CHECKED_IN",
  details: [
    {
      id: "d2",
      roomId: "r1",
      room: { id: "r1", roomNumber: "101", type: "DELUXE" },
    },
  ],
  user: { fullName: "Dawit Alemu", email: "dawit@example.com", phone: null },
}

const pendingReview = {
  id: "rev1",
  hotelId: "h1",
  rating: 5,
  comment: "Amazing stay and wonderful staff.",
  createdAt: "2026-09-10T00:00:00.000Z",
  response: null,
  user: { fullName: "Abebe Kebede" },
  booking: { bookingRef: "LX-1001" },
}

const respondedReview = {
  id: "rev2",
  hotelId: "h1",
  rating: 2,
  comment: "The room was far too noisy at night.",
  createdAt: "2026-09-12T00:00:00.000Z",
  response: "We are sorry about the noise.",
  respondedBy: { fullName: "Miki Alemu" },
  respondedAt: "2026-09-13T00:00:00.000Z",
  user: { fullName: "Sara Bekele" },
}

const reviewsPayload = {
  data: [pendingReview, respondedReview],
  meta: { total: 2, page: 1, pageSize: 20, pageCount: 1 },
  summary: {
    averageRating: 3.5,
    reviewCount: 2,
    respondedCount: 1,
    pendingResponseCount: 1,
  },
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
  mgr.bookings.mockResolvedValue({
    data: [pendingBooking, confirmedBooking, checkedInBooking],
  })
  mgr.stats.mockResolvedValue({
    pendingApprovals: 1,
    todaysCheckIns: 2,
    todaysCheckOuts: 1,
    activeGuests: 3,
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
  mgr.listReviews.mockResolvedValue(reviewsPayload)
  mgr.respondToReview.mockResolvedValue(undefined)
  mgr.deleteReviewResponse.mockResolvedValue(undefined)
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
  pay.markCashPaid.mockResolvedValue(undefined)
  cat.countries.mockResolvedValue([])
  cat.cities.mockResolvedValue([])
  cat.getById.mockResolvedValue({ ...hotel, rooms: [availableRoom] })

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

describe("Bookings tab actions", () => {
  it("rejects, checks in, and checks out reservations", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Bookings")
    await screen.findByRole("heading", { name: "Guest Reservations" })

    await user.click(screen.getByRole("button", { name: "Reject" }))
    await waitFor(() =>
      expect(mgr.action).toHaveBeenCalledWith("bk-pending-00000001", "reject"),
    )
    expect(
      await screen.findByText("Booking marked as rejected."),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Check In" }))
    await waitFor(() =>
      expect(mgr.action).toHaveBeenCalledWith(
        "bk-confirmed-00000002",
        "check-in",
      ),
    )
    expect(
      await screen.findByText("Booking marked as checked-in."),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Check Out" }))
    await waitFor(() =>
      expect(mgr.action).toHaveBeenCalledWith(
        "bk-checkedin-0000004",
        "check-out",
      ),
    )
    expect(
      await screen.findByText("Booking marked as checked-out."),
    ).toBeInTheDocument()
  })

  it("reports booking action failures", async () => {
    mgr.action.mockRejectedValueOnce(new Error("action refused"))
    const user = userEvent.setup()
    await renderTab(user, "Bookings")
    await screen.findByRole("heading", { name: "Guest Reservations" })

    await user.click(screen.getByRole("button", { name: "Reject" }))

    expect(await screen.findByText("action refused")).toBeInTheDocument()
  })

  it("registers a walk-in guest through the modal", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Bookings")
    await screen.findByRole("heading", { name: "Guest Reservations" })

    await user.click(screen.getByRole("button", { name: "+ Walk-in Guest" }))
    expect(
      await screen.findByRole("heading", { name: "Front Desk Walk-In Guest" }),
    ).toBeInTheDocument()

    const roomSelect = screen.getByDisplayValue("Choose an available room…")
    fireEvent.change(roomSelect, { target: { value: "r1" } })

    await user.type(
      screen.getByPlaceholderText("e.g. Abebe Bikila"),
      "Yeshi Tesfaye",
    )
    await user.type(
      screen.getByPlaceholderText("+251 91 123 4567"),
      "+251911778899",
    )
    await user.type(
      screen.getByPlaceholderText("guest@example.com"),
      "yeshi@example.com",
    )

    await user.click(screen.getByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: "Register Walk-In" }))

    await waitFor(() =>
      expect(mgr.createWalkIn).toHaveBeenCalledWith(
        expect.objectContaining({
          hotelId: "h1",
          roomIds: ["r1"],
          guestName: "Yeshi Tesfaye",
          guestPhone: "+251911778899",
          guestEmail: "yeshi@example.com",
          paidImmediately: false,
        }),
      ),
    )
    expect(
      await screen.findByText(
        "Walk-in guest checked in & reservation registered!",
      ),
    ).toBeInTheDocument()
  })

  it("reports walk-in creation failures", async () => {
    mgr.createWalkIn.mockRejectedValueOnce(new Error("room unavailable"))
    const user = userEvent.setup()
    await renderTab(user, "Bookings")
    await screen.findByRole("heading", { name: "Guest Reservations" })

    await user.click(screen.getByRole("button", { name: "+ Walk-in Guest" }))
    await screen.findByRole("heading", { name: "Front Desk Walk-In Guest" })
    fireEvent.change(screen.getByDisplayValue("Choose an available room…"), {
      target: { value: "r1" },
    })
    await user.type(
      screen.getByPlaceholderText("e.g. Abebe Bikila"),
      "Yeshi Tesfaye",
    )
    await user.type(
      screen.getByPlaceholderText("+251 91 123 4567"),
      "+251911778899",
    )
    await user.click(screen.getByRole("button", { name: "Register Walk-In" }))

    expect(await screen.findByText("room unavailable")).toBeInTheDocument()
  })

  it("marks a confirmed reservation as a no-show", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Bookings")
    await screen.findByRole("heading", { name: "Guest Reservations" })

    await user.click(screen.getByRole("button", { name: "No-Show" }))
    expect(
      await screen.findByRole("heading", { name: "Confirm Guest No-Show" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Reservation Ref:")).toBeInTheDocument()
    expect(screen.getAllByText("LX-99313").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Sara Bekele").length).toBeGreaterThan(1)
    expect(screen.getByText("Room 101 (Deluxe)")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(
      screen.queryByRole("heading", { name: "Confirm Guest No-Show" }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "No-Show" }))
    await screen.findByRole("heading", { name: "Confirm Guest No-Show" })
    await user.click(screen.getByRole("button", { name: "Confirm No-Show" }))

    await waitFor(() =>
      expect(mgr.noShow).toHaveBeenCalledWith("bk-confirmed-00000002"),
    )
    expect(
      await screen.findByText(
        "Booking LX-99313 successfully marked as No-Show. Room availability has been restored.",
      ),
    ).toBeInTheDocument()
  })

  it("relocates a checked-in guest into another room", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Bookings")
    await screen.findByRole("heading", { name: "Guest Reservations" })

    await user.click(screen.getByRole("button", { name: "Relocate Room" }))
    expect(
      await screen.findByRole("heading", { name: "Relocate Checked-In Guest" }),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue("Select target room…"), {
      target: { value: "r1" },
    })
    fireEvent.change(screen.getByDisplayValue("Room upgrade / maintenance"), {
      target: { value: "Guest requested a quiet floor" },
    })
    await user.click(screen.getByRole("button", { name: "Relocate Guest" }))

    await waitFor(() =>
      expect(mgr.relocateRoom).toHaveBeenCalledWith("bk-checkedin-0000004", {
        oldRoomId: "r1",
        newRoomId: "r1",
        reason: "Guest requested a quiet floor",
      }),
    )
    expect(
      await screen.findByText("Guest relocated to new room successfully!"),
    ).toBeInTheDocument()
  })

  it("reports relocation failures", async () => {
    mgr.relocateRoom.mockRejectedValueOnce(new Error("target occupied"))
    const user = userEvent.setup()
    await renderTab(user, "Bookings")
    await screen.findByRole("heading", { name: "Guest Reservations" })

    await user.click(screen.getByRole("button", { name: "Relocate Room" }))
    await screen.findByRole("heading", { name: "Relocate Checked-In Guest" })
    fireEvent.change(screen.getByDisplayValue("Select target room…"), {
      target: { value: "r1" },
    })
    await user.click(screen.getByRole("button", { name: "Relocate Guest" }))

    expect(await screen.findByText("target occupied")).toBeInTheDocument()
  })
})

describe("Reviews tab", () => {
  it("shows review metrics and filter pills", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Reviews")

    expect(
      await screen.findByRole("heading", {
        name: "Guest Reviews & Public Responses",
      }),
    ).toBeInTheDocument()
    expect(screen.getByText("Total Reviews")).toBeInTheDocument()
    expect(screen.getByText("3.5")).toBeInTheDocument()
    expect(screen.getByText("Responded")).toBeInTheDocument()
    expect(screen.getByText("Needs Response")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "All Reviews (2)" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Needs Response (1)" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Responded (1)" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Amazing stay and wonderful staff."),
    ).toBeInTheDocument()
    expect(
      screen.getByText("The room was far too noisy at night."),
    ).toBeInTheDocument()
  })

  it("filters reviews and shows the empty filter state", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Reviews")
    await screen.findByRole("heading", {
      name: "Guest Reviews & Public Responses",
    })

    await user.click(screen.getByRole("button", { name: "Needs Response (1)" }))
    await waitFor(() =>
      expect(
        screen.queryByText("The room was far too noisy at night."),
      ).not.toBeInTheDocument(),
    )
    expect(
      screen.getByText("Amazing stay and wonderful staff."),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Responded (1)" }))
    await waitFor(() =>
      expect(
        screen.queryByText("Amazing stay and wonderful staff."),
      ).not.toBeInTheDocument(),
    )
    expect(
      screen.getByText("The room was far too noisy at night."),
    ).toBeInTheDocument()
  })

  it("publishes a public response using a quick template", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Reviews")
    await screen.findByRole("heading", {
      name: "Guest Reviews & Public Responses",
    })

    await user.click(
      screen.getAllByRole("button", { name: "Respond Publicly" })[0],
    )
    expect(await screen.findByText("Write Public Response")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Warm Gratitude" }))
    const textarea = screen.getByPlaceholderText(
      "Write a professional, courteous response that will be visible to all potential guests...",
    )
    expect(textarea).toHaveValue(
      "Thank you for your warm feedback! We are thrilled you had a memorable stay with us and hope to welcome you back again soon.",
    )

    await user.click(screen.getByRole("button", { name: "Publish Response" }))

    await waitFor(() =>
      expect(mgr.respondToReview).toHaveBeenCalledWith(
        "h1",
        "rev1",
        expect.stringContaining("Thank you"),
      ),
    )
    expect(
      await screen.findByText(
        "Public management response published successfully.",
      ),
    ).toBeInTheDocument()
  })

  it("cancels an in-progress response composer", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Reviews")
    await screen.findByRole("heading", {
      name: "Guest Reviews & Public Responses",
    })

    await user.click(
      screen.getAllByRole("button", { name: "Respond Publicly" })[0],
    )
    await screen.findByText("Write Public Response")
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(screen.queryByText("Write Public Response")).not.toBeInTheDocument()
    expect(mgr.respondToReview).not.toHaveBeenCalled()
  })

  it("edits and deletes an existing public response", async () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true)
    const user = userEvent.setup()
    await renderTab(user, "Reviews")
    await screen.findByRole("heading", {
      name: "Guest Reviews & Public Responses",
    })

    expect(screen.getByText("Official Management Response")).toBeInTheDocument()
    expect(screen.getByText(/by Miki Alemu/)).toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0])
    expect(
      await screen.findByText("Edit Management Response"),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(
      screen.queryByText("Edit Management Response"),
    ).not.toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0])
    await waitFor(() =>
      expect(mgr.deleteReviewResponse).toHaveBeenCalledWith("h1", "rev2"),
    )
    expect(
      await screen.findByText("Public management response removed."),
    ).toBeInTheDocument()
    expect(confirmSpy).toHaveBeenCalled()
  })

  it("reports response publishing failures", async () => {
    mgr.respondToReview.mockRejectedValueOnce(
      new Error("moderation queue full"),
    )
    const user = userEvent.setup()
    await renderTab(user, "Reviews")
    await screen.findByRole("heading", {
      name: "Guest Reviews & Public Responses",
    })

    await user.click(
      screen.getAllByRole("button", { name: "Respond Publicly" })[0],
    )
    await screen.findByText("Write Public Response")
    await user.click(screen.getByRole("button", { name: "Service Recovery" }))
    await user.click(screen.getByRole("button", { name: "Publish Response" }))

    expect(await screen.findByText("moderation queue full")).toBeInTheDocument()
  })

  it("refreshes the review feed", async () => {
    const user = userEvent.setup()
    await renderTab(user, "Reviews")
    await screen.findByRole("heading", {
      name: "Guest Reviews & Public Responses",
    })
    const before = cat.getById.mock.calls.length

    await user.click(screen.getByRole("button", { name: "Refresh" }))

    await waitFor(() =>
      expect(cat.getById.mock.calls.length).toBeGreaterThan(before),
    )
  })
})
