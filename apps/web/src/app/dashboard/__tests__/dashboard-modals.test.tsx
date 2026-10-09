import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import CustomerDashboardPage from "@/app/dashboard/page"
import { useAuth } from "@/lib/auth-store"
import { bookingService } from "@/services/booking.service"
import { catalogService } from "@/services/catalog.service"
import { paymentService } from "@/services/payment.service"
import type { User } from "@/lib/types"

let mockTab = "bookings"
const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(`tab=${mockTab}`),
  useParams: () => ({}),
}))

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string ;alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}))

jest.mock("@/services/booking.service", () => ({
  bookingService: {
    getMyBookings: jest.fn(),
    cancelBooking: jest.fn(),
    createStayRequest: jest.fn(),
    modifyBooking: jest.fn(),
    downloadInvoice: jest.fn(),
    getInvoiceDownloadUrl: jest.fn(
      (id: string) => `/api/bookings/${id}/invoice`,
    ),
  },
}))

jest.mock("@/services/catalog.service", () => ({
  catalogService: {
    getFavorites: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    getMyReviews: jest.fn(),
    createReview: jest.fn(),
    deleteReview: jest.fn(),
  },
}))

jest.mock("@/services/payment.service", () => ({
  paymentService: {
    getMyPayments: jest.fn(),
  },
}))

const book = bookingService as unknown as Record<string, jest.Mock>
const cat = catalogService as unknown as Record<string, jest.Mock>
const pay = paymentService as unknown as Record<string, jest.Mock>

const customerUser: User = {
  id: "u-ada",
  email: "ada@luxstay.test",
  fullName: "Ada Worku",
  role: "CUSTOMER",
  isActive: true,
  createdAt: "2026-01-05T00:00:00.000Z",
}

const base = {
  hotelId: "h1",
  userId: "u-ada",
  payment: null,
  details: [{ room: { type: "DELUXE" } }],
  totalPrice: 8400,
}

const inDays = (n: number) =>
  new Date(Date.now() + n * 86_400_000).toISOString()

const upcomingSoon = {
  ...base,
  id: "bk-soon-00000001",
  status: "CONFIRMED",
  checkIn: inDays(5),
  checkOut: inDays(9),
  hotel: {
    id: "h1",
    name: "Skylight Hotel",
    address: "Bole Road, Addis Ababa",
    images: [],
  },
}

const upcomingImminent = {
  ...base,
  id: "bk-imminent-0002",
  status: "CONFIRMED",
  checkIn: inDays(1),
  checkOut: inDays(3),
  hotel: {
    id: "h2",
    name: "Nile View Lodge",
    address: "Corniche, Addis Ababa",
    images: [],
  },
}

const completedBooking = {
  ...base,
  id: "bk-done-00000003",
  status: "CHECKED_OUT",
  checkIn: inDays(-40),
  checkOut: inDays(-36),
  hotel: {
    id: "h3",
    name: "Highland Retreat",
    address: "Bahir Dar",
    images: [],
  },
}

const cancelledBooking = {
  ...base,
  id: "bk-void-00000004",
  status: "CANCELLED",
  checkIn: inDays(30),
  checkOut: inDays(34),
  hotel: {
    id: "h4",
    name: "Desert Rose Inn",
    address: "Arba Minch",
    images: [],
  },
}

const renderDashboard = async (heading = "Reservation History") => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <CustomerDashboardPage />
    </QueryClientProvider>,
  )
  await screen.findByRole("heading", { name: "Welcome, Ada" })
  await screen.findByRole("heading", { name: heading })
}

beforeEach(() => {
  mockTab = "bookings"
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

  book.getMyBookings.mockResolvedValue({
    data: [upcomingSoon, upcomingImminent, completedBooking, cancelledBooking],
  })
  book.cancelBooking.mockResolvedValue(undefined)
  book.createStayRequest.mockResolvedValue(undefined)
  book.modifyBooking.mockResolvedValue(undefined)
  book.downloadInvoice.mockResolvedValue(undefined)
  cat.getFavorites.mockResolvedValue([])
  cat.getMyReviews.mockResolvedValue([])
  cat.createReview.mockResolvedValue(undefined)
  pay.getMyPayments.mockResolvedValue({ data: [] })

  useAuth
    .getState()
    .setSession({ user: customerUser, accessToken: "at", refreshToken: "rt" })
})

describe("CustomerDashboardPage stay request modal", () => {
  it("submits an early check-in request from the reservations list", async () => {
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(
      screen.getAllByRole("button", { name: "Concierge Request" })[0],
    )

    expect(
      await screen.findByRole("heading", { name: "Special Stay Request" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/subject to room housekeeping turnover/),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Submit Request" }))

    await waitFor(() =>
      expect(book.createStayRequest).toHaveBeenCalledWith("bk-soon-00000001", {
        type: "EARLY_CHECK_IN",
        requestedTime: "11:00",
      }),
    )
    expect(
      await screen.findByText("Stay request submitted to the hotel concierge."),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Special Stay Request" }),
    ).not.toBeInTheDocument()
  }, 15000)

  it("switches the request to a late check-out and honours the chosen time", async () => {
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(
      screen.getAllByRole("button", { name: "Concierge Request" })[1],
    )
    await screen.findByRole("heading", { name: "Special Stay Request" })

    await user.selectOptions(screen.getByRole("combobox"), "LATE_CHECK_OUT")
    fireEvent.change(
      document.querySelector('input[type="time"]') as HTMLInputElement,
      {
        target: { value: "15:30" },
      },
    )
    await user.click(screen.getByRole("button", { name: "Submit Request" }))

    await waitFor(() =>
      expect(book.createStayRequest).toHaveBeenCalledWith("bk-imminent-0002", {
        type: "LATE_CHECK_OUT",
        requestedTime: "15:30",
      }),
    )
  }, 15000)

  it("closes the stay request modal from the header and the cancel action", async () => {
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(
      screen.getAllByRole("button", { name: "Concierge Request" })[0],
    )
    const modal = (
      await screen.findByRole("heading", { name: "Special Stay Request" })
    ).closest(".fixed") as HTMLElement
    await user.click(within(modal).getAllByRole("button")[0])
    expect(
      screen.queryByRole("heading", { name: "Special Stay Request" }),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getAllByRole("button", { name: "Concierge Request" })[0],
    )
    await screen.findByRole("heading", { name: "Special Stay Request" })
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(
      screen.queryByRole("heading", { name: "Special Stay Request" }),
    ).not.toBeInTheDocument()
    expect(book.createStayRequest).not.toHaveBeenCalled()
  }, 15000)

  it("reports a rejected concierge request in the error banner", async () => {
    book.createStayRequest.mockRejectedValue(
      new Error("Rooms are fully booked"),
    )
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(
      screen.getAllByRole("button", { name: "Concierge Request" })[0],
    )
    await screen.findByRole("heading", { name: "Special Stay Request" })
    await user.click(screen.getByRole("button", { name: "Submit Request" }))

    expect(
      await screen.findByText("Rooms are fully booked"),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    )
    expect(screen.queryByText("Rooms are fully booked")).not.toBeInTheDocument()
  }, 15000)
})

describe("CustomerDashboardPage modify dates modal", () => {
  it("sends the new stay window with an optional reason", async () => {
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getAllByRole("button", { name: "Modify Dates" })[0])

    expect(
      await screen.findByRole("heading", { name: "Modify Stay Dates" }),
    ).toBeInTheDocument()
    const newCheckIn = inDays(6).slice(0, 10)
    const newCheckOut = inDays(10).slice(0, 10)
    fireEvent.change(
      document.querySelector('input[type="date"]') as HTMLInputElement,
      {
        target: { value: newCheckIn },
      },
    )
    fireEvent.change(
      document.querySelectorAll('input[type="date"]')[1] as HTMLInputElement,
      {
        target: { value: newCheckOut },
      },
    )
    await user.type(
      screen.getByPlaceholderText("e.g. Schedule adjustment"),
      "Family visiting",
    )
    await user.click(screen.getByRole("button", { name: "Apply Date Changes" }))

    await waitFor(() =>
      expect(book.modifyBooking).toHaveBeenCalledWith("bk-soon-00000001", {
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        reason: "Family visiting",
      }),
    )
    expect(
      await screen.findByText("Stay dates modified successfully."),
    ).toBeInTheDocument()
  }, 15000)

  it("discards pending edits when the modal is dismissed", async () => {
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getAllByRole("button", { name: "Modify Dates" })[0])
    const heading = await screen.findByRole("heading", {
      name: "Modify Stay Dates",
    })
    await user.click(
      within(heading.closest(".fixed") as HTMLElement).getAllByRole(
        "button",
      )[0],
    )
    expect(
      screen.queryByRole("heading", { name: "Modify Stay Dates" }),
    ).not.toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "Modify Dates" })[0])
    await screen.findByRole("heading", { name: "Modify Stay Dates" })
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(
      screen.queryByRole("heading", { name: "Modify Stay Dates" }),
    ).not.toBeInTheDocument()
    expect(book.modifyBooking).not.toHaveBeenCalled()
  }, 15000)

  it("surfaces a rejected date change", async () => {
    book.modifyBooking.mockRejectedValue(
      new Error("Room is not available for those dates"),
    )
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getAllByRole("button", { name: "Modify Dates" })[0])
    await screen.findByRole("heading", { name: "Modify Stay Dates" })
    await user.click(screen.getByRole("button", { name: "Apply Date Changes" }))

    expect(
      await screen.findByText("Room is not available for those dates"),
    ).toBeInTheDocument()
  }, 15000)
})

describe("CustomerDashboardPage verified review modal", () => {
  it("publishes a rating and comment for a completed stay", async () => {
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getByRole("button", { name: "Leave Review" }))

    expect(
      await screen.findByRole("heading", { name: "Verified Guest Review" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Share your experience for your completed stay at/),
    ).toBeInTheDocument()

    const overlay = screen
      .getByRole("heading", { name: "Verified Guest Review" })
      .closest(".fixed") as HTMLElement
    await user.click(within(overlay).getAllByRole("button")[4])
    await user.type(
      screen.getByPlaceholderText(/Describe your hospitality experience/),
      "Quiet suite and attentive staff.",
    )
    await user.click(screen.getByRole("button", { name: "Publish Review" }))

    await waitFor(() =>
      expect(cat.createReview).toHaveBeenCalledWith({
        hotelId: "h1",
        bookingId: "bk-done-00000003",
        rating: 4,
        comment: "Quiet suite and attentive staff.",
      }),
    )
    expect(
      await screen.findByText(
        "Thank you! Your verified review has been published.",
      ),
    ).toBeInTheDocument()
  }, 15000)

  it("leaves the review untouched when the modal is dismissed", async () => {
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getByRole("button", { name: "Leave Review" }))
    const heading = await screen.findByRole("heading", {
      name: "Verified Guest Review",
    })
    await user.click(
      within(heading.closest(".fixed") as HTMLElement).getAllByRole(
        "button",
      )[0],
    )
    expect(
      screen.queryByRole("heading", { name: "Verified Guest Review" }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Leave Review" }))
    await screen.findByRole("heading", { name: "Verified Guest Review" })
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(
      screen.queryByRole("heading", { name: "Verified Guest Review" }),
    ).not.toBeInTheDocument()
    expect(cat.createReview).not.toHaveBeenCalled()
  }, 15000)

  it("reports a rejected review submission", async () => {
    cat.createReview.mockRejectedValue(
      new Error("Only verified guests may review"),
    )
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getByRole("button", { name: "Leave Review" }))
    await screen.findByRole("heading", { name: "Verified Guest Review" })
    await user.type(
      screen.getByPlaceholderText(/Describe your hospitality experience/),
      "Great stay.",
    )
    await user.click(screen.getByRole("button", { name: "Publish Review" }))

    expect(
      await screen.findByText("Only verified guests may review"),
    ).toBeInTheDocument()
  }, 15000)

  it("keeps the publish action disabled until a comment is written", async () => {
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getByRole("button", { name: "Leave Review" }))
    await screen.findByRole("heading", { name: "Verified Guest Review" })

    expect(
      screen.getByRole("button", { name: "Publish Review" }),
    ).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled()
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Verified Guest Review" }),
      ).toBeNull(),
    )
  }, 15000)
})

describe("CustomerDashboardPage overview reservation card", () => {
  it("requests an early check-in straight from the hero card", async () => {
    mockTab = "overview"
    const user = userEvent.setup()
    await renderDashboard("Upcoming Reservation")

    await user.click(screen.getByRole("button", { name: "Concierge Request" }))
    expect(
      await screen.findByRole("heading", { name: "Special Stay Request" }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Submit Request" }))

    await waitFor(() =>
      expect(book.createStayRequest).toHaveBeenCalledWith("bk-soon-00000001", {
        type: "EARLY_CHECK_IN",
        requestedTime: "11:00",
      }),
    )
  }, 15000)

  it("pulls the invoice for the hero reservation", async () => {
    mockTab = "overview"
    const user = userEvent.setup()
    await renderDashboard("Upcoming Reservation")

    await user.click(screen.getByRole("button", { name: "PDF Invoice" }))

    await waitFor(() =>
      expect(book.downloadInvoice).toHaveBeenCalledWith("bk-soon-00000001"),
    )
  }, 15000)

  it("opens the cancellation disclosure from the hero card", async () => {
    mockTab = "overview"
    const user = userEvent.setup()
    await renderDashboard("Upcoming Reservation")

    await user.click(screen.getByRole("button", { name: "Cancel Stay" }))

    expect(await screen.findByText("Cancel Reservation")).toBeInTheDocument()
    expect(screen.getByText("Partial Refund (50%)")).toBeInTheDocument()
  }, 15000)
})
