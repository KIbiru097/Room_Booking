import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import CustomerDashboardPage from "@/app/dashboard/page"
import { useAuth } from "@/lib/auth-store"
import { bookingService } from "@/services/booking.service"
import { catalogService } from "@/services/catalog.service"
import { paymentService } from "@/services/payment.service"
import type { User } from "@/lib/types"

let mockTab = "overview"
const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () =>
    new URLSearchParams(mockTab === "overview" ? "" : `tab=${mockTab}`),
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

const upcomingBooking = {
  id: "bk-upcoming-0001",
  hotelId: "h1",
  userId: "u-ada",
  hotel: {
    id: "h1",
    name: "Skylight Hotel",
    address: "Bole Road, Addis Ababa",
    images: [],
  },
  checkIn: "2026-11-01T00:00:00.000Z",
  checkOut: "2026-11-05T00:00:00.000Z",
  status: "CONFIRMED",
  totalPrice: 8400,
  payment: null,
  details: [{ room: { type: "DELUXE" } }],
}

const completedBooking = {
  ...upcomingBooking,
  id: "bk-completed-0002",
  hotel: {
    id: "h2",
    name: "Nile View Lodge",
    address: "Corniche, Addis Ababa",
    images: [],
  },
  status: "CHECKED_OUT",
  checkIn: "2026-04-10T00:00:00.000Z",
  checkOut: "2026-04-14T00:00:00.000Z",
}

const cancelledBooking = {
  ...upcomingBooking,
  id: "bk-cancelled-0003",
  hotel: {
    id: "h3",
    name: "Highland Retreat",
    address: "Bahir Dar",
    images: [],
  },
  status: "CANCELLED",
  checkIn: "2026-08-01T00:00:00.000Z",
  checkOut: "2026-08-03T00:00:00.000Z",
}

const renderDashboard = async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <CustomerDashboardPage />
    </QueryClientProvider>,
  )
  await screen.findByRole("heading", { name: "Welcome, Ada" })
}

beforeEach(() => {
  mockTab = "overview"
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
    data: [upcomingBooking, completedBooking, cancelledBooking],
  })
  book.cancelBooking.mockResolvedValue(undefined)
  book.createStayRequest.mockResolvedValue(undefined)
  book.modifyBooking.mockResolvedValue(undefined)
  book.downloadInvoice.mockResolvedValue(undefined)
  cat.getFavorites.mockResolvedValue([])
  cat.getMyReviews.mockResolvedValue([])
  pay.getMyPayments.mockResolvedValue({ data: [] })

  useAuth
    .getState()
    .setSession({ user: customerUser, accessToken: "at", refreshToken: "rt" })
})

describe("CustomerDashboardPage overview and bookings", () => {
  it("greets the guest with quick stay metrics and the upcoming reservation", async () => {
    await renderDashboard()

    expect(screen.getByText("Luxury Member")).toBeInTheDocument()
    expect(screen.getByText("Upcoming")).toBeInTheDocument()
    expect(screen.getByText("Total Stays")).toBeInTheDocument()
    expect(screen.getByText("Saved")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Upcoming Reservation" }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole("heading", { name: "Skylight Hotel" }),
    ).toBeInTheDocument()
    expect(book.getMyBookings).toHaveBeenCalled()
  }, 15000)

  it("navigates to the bookings tab from the tab bar", async () => {
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getByRole("button", { name: /^My Bookings/ }))

    expect(mockPush).toHaveBeenCalledWith("/dashboard?tab=bookings")
  }, 15000)

  it("lists reservations and narrows them with the status filter", async () => {
    mockTab = "bookings"
    const user = userEvent.setup()
    await renderDashboard()

    expect(
      screen.getByRole("heading", { name: "Reservation History" }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole("heading", { name: "Skylight Hotel" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Nile View Lodge" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Highland Retreat" }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Completed" }))

    expect(
      screen.getByRole("heading", { name: "Nile View Lodge" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Skylight Hotel" }),
    ).not.toBeInTheDocument()
  }, 15000)

  it("cancels an upcoming stay after the refund disclosure", async () => {
    mockTab = "bookings"
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(await screen.findByRole("button", { name: "Cancel Stay" }))
    expect(await screen.findByText("Cancel Reservation")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Confirm Cancellation" }),
    )

    await waitFor(() =>
      expect(book.cancelBooking).toHaveBeenCalledWith("bk-upcoming-0001"),
    )
    expect(
      await screen.findByText(
        "Reservation cancelled successfully. Refund processing has been initiated.",
      ),
    ).toBeInTheDocument()
  }, 15000)

  it("shows a filter-aware empty state when a category has no stays", async () => {
    mockTab = "bookings"
    book.getMyBookings.mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getByRole("button", { name: "Cancelled" }))

    expect(
      await screen.findByRole("heading", { name: "No Reservations Found" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("No Cancelled reservations found in your account."),
    ).toBeInTheDocument()
    expect(book.getMyBookings).toHaveBeenCalled()
  }, 15000)
})
