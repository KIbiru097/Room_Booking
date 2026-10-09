import { render, screen, waitFor, within } from "@testing-library/react"
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
  pay.getMyPayments.mockResolvedValue({ data: [] })

  useAuth
    .getState()
    .setSession({ user: customerUser, accessToken: "at", refreshToken: "rt" })
})

describe("CustomerDashboardPage cancellation refund disclosure", () => {
  it("offers a 50% refund for a stay cancelled inside a week", async () => {
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getAllByRole("button", { name: "Cancel Stay" })[0])

    expect(await screen.findByText("Cancel Reservation")).toBeInTheDocument()
    expect(screen.getByText("Partial Refund (50%)")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Stays cancelled 3 to 6 days prior to check-in are eligible for a 50% refund.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("Estimated Refund:")).toBeInTheDocument()
  }, 15000)

  it("marks a stay inside 48 hours as non-refundable", async () => {
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getAllByRole("button", { name: "Cancel Stay" })[1])

    expect(await screen.findByText("Cancel Reservation")).toBeInTheDocument()
    expect(screen.getByText("Non-Refundable")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Cancellations within 48 hours of check-in are non-refundable under standard policy.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("ETB 0")).toBeInTheDocument()
  }, 15000)

  it("keeps the reservation when the guest backs out of the modal", async () => {
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getAllByRole("button", { name: "Cancel Stay" })[0])
    const heading = await screen.findByText("Cancel Reservation")
    await user.click(
      within(heading.closest(".fixed") as HTMLElement).getAllByRole(
        "button",
      )[0],
    )
    expect(screen.queryByText("Cancel Reservation")).not.toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "Cancel Stay" })[0])
    await screen.findByText("Cancel Reservation")
    await user.click(screen.getByRole("button", { name: "Keep Stay" }))

    expect(screen.queryByText("Cancel Reservation")).not.toBeInTheDocument()
    expect(book.cancelBooking).not.toHaveBeenCalled()
  }, 15000)

  it("surfaces a rejected cancellation in the error banner and dismisses it", async () => {
    book.cancelBooking.mockRejectedValue(
      new Error("Cancellation window has closed"),
    )
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getAllByRole("button", { name: "Cancel Stay" })[0])
    await screen.findByText("Cancel Reservation")
    await user.click(
      screen.getByRole("button", { name: "Confirm Cancellation" }),
    )

    expect(
      await screen.findByText("Cancellation window has closed"),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    )
    expect(
      screen.queryByText("Cancellation window has closed"),
    ).not.toBeInTheDocument()
    expect(screen.getByText("Cancel Reservation")).toBeInTheDocument()
  }, 15000)

  it("dismisses the success banner after a completed cancellation", async () => {
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getAllByRole("button", { name: "Cancel Stay" })[0])
    await screen.findByText("Cancel Reservation")
    await user.click(
      screen.getByRole("button", { name: "Confirm Cancellation" }),
    )

    expect(
      await screen.findByText(
        "Reservation cancelled successfully. Refund processing has been initiated.",
      ),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    )
    expect(
      screen.queryByText(
        "Reservation cancelled successfully. Refund processing has been initiated.",
      ),
    ).not.toBeInTheDocument()
  }, 15000)
})

describe("CustomerDashboardPage invoice downloads", () => {
  it("downloads the invoice for a reservation", async () => {
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getAllByRole("button", { name: "PDF Invoice" })[0])

    await waitFor(() =>
      expect(book.downloadInvoice).toHaveBeenCalledWith("bk-soon-00000001"),
    )
  }, 15000)

  it("falls back to the tokenized invoice URL when the download blows up", async () => {
    book.downloadInvoice.mockRejectedValue(new Error("blob unavailable"))
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null)
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getAllByRole("button", { name: "PDF Invoice" })[1])

    await waitFor(() =>
      expect(openSpy).toHaveBeenCalledWith(
        "/api/bookings/bk-imminent-0002/invoice",
        "_blank",
      ),
    )
    openSpy.mockRestore()
  }, 15000)
})

describe("CustomerDashboardPage reservation filters", () => {
  it("narrows the list to stays that are still ahead", async () => {
    const user = userEvent.setup()
    await renderDashboard()

    await user.click(screen.getByRole("button", { name: "Upcoming" }))

    expect(
      await screen.findByRole("heading", { name: "Skylight Hotel" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Nile View Lodge" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Highland Retreat" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Desert Rose Inn" }),
    ).not.toBeInTheDocument()
  }, 15000)

  it("shows the catch-all empty state when nothing matches at all", async () => {
    book.getMyBookings.mockResolvedValue({ data: [] })
    await renderDashboard()

    expect(
      await screen.findByRole("heading", { name: "No Reservations Found" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("You have not booked any stays yet."),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Explore Hotels/ }),
    ).toHaveAttribute("href", "/search")
  }, 15000)

  it("renders a dash when a payment carries no timestamp", async () => {
    mockTab = "payments"
    pay.getMyPayments.mockResolvedValue({
      data: [
        {
          id: "pay-00000009",
          bookingId: "bk-soon-00000001",
          providerRef: null,
          method: "CASH",
          amount: 1200,
          status: "SUCCEEDED",
          createdAt: "",
          booking: {
            id: "bk-soon-00000001",
            hotel: { id: "h1", name: "Skylight Hotel" },
          },
        },
      ],
    })
    await renderDashboard("Payment Ledger")

    expect(screen.getByText("— · Ref: 00000009")).toBeInTheDocument()
  }, 15000)
})
