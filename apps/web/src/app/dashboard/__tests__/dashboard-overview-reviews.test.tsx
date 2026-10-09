import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import CustomerDashboardPage from "@/app/dashboard/page"
import { useAuth } from "@/lib/auth-store"
import { bookingService } from "@/services/booking.service"
import { catalogService } from "@/services/catalog.service"
import { paymentService } from "@/services/payment.service"
import type { User } from "@/lib/types"

let mockTab = "reviews"
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
  paymentService: { getMyPayments: jest.fn() },
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

const review = {
  id: "rev-00000001",
  hotelId: "h1",
  hotel: { id: "h1", name: "Skylight Hotel" },
  rating: 4,
  comment: "Impeccable service and a wonderfully quiet suite.",
  createdAt: "2026-05-12T00:00:00.000Z",
}

const favorite = {
  id: "h-fav",
  name: "Amora Lodge",
  primaryImageUrl: null,
  minPricePerNight: 3200,
  city: { name: "Addis Ababa", country: { name: "Ethiopia" } },
}

const renderDashboard = async (heading: string) => {
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
  mockTab = "reviews"
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

  book.getMyBookings.mockResolvedValue({ data: [] })
  cat.getFavorites.mockResolvedValue([])
  cat.getMyReviews.mockResolvedValue([])
  cat.deleteReview.mockResolvedValue(undefined)
  cat.removeFavorite.mockResolvedValue(undefined)
  pay.getMyPayments.mockResolvedValue({ data: [] })

  useAuth
    .getState()
    .setSession({ user: customerUser, accessToken: "at", refreshToken: "rt" })
})

describe("CustomerDashboardPage verified reviews ledger", () => {
  it("lists a published review with its star score", async () => {
    cat.getMyReviews.mockResolvedValue([review])
    await renderDashboard("My Verified Reviews")

    expect(
      await screen.findByText(
        "Impeccable service and a wonderfully quiet suite.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("Skylight Hotel")).toBeInTheDocument()
    expect(screen.getByText(/^Published /)).toBeInTheDocument()
    expect(document.querySelectorAll("svg.fill-current")).toHaveLength(4)
  }, 15000)

  it("removes a review from the ledger", async () => {
    cat.getMyReviews.mockResolvedValue([review])
    const user = userEvent.setup()
    await renderDashboard("My Verified Reviews")
    await screen.findByText("Impeccable service and a wonderfully quiet suite.")

    await user.click(screen.getByRole("button", { name: "Delete" }))

    await waitFor(() =>
      expect(cat.deleteReview).toHaveBeenCalledWith("rev-00000001"),
    )
  }, 15000)
})

describe("CustomerDashboardPage overview quick cards", () => {
  it("shows saved stays shortcuts on the overview tab", async () => {
    mockTab = "overview"
    cat.getFavorites.mockResolvedValue([favorite])
    const user = userEvent.setup()
    await renderDashboard("Upcoming Reservation")

    expect(
      screen.getByRole("heading", { name: "No Upcoming Reservations" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Saved Stays" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Amora Lodge" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Addis Ababa, Ethiopia")).toBeInTheDocument()
    expect(screen.getByText("ETB 3,200")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Book Stay" })).toHaveAttribute(
      "href",
      "/hotel/h-fav",
    )

    await user.click(screen.getByRole("button", { name: "View All (1)" }))
    expect(mockPush).toHaveBeenCalledWith("/dashboard?tab=wishlist")
  }, 15000)

  it("un-saves a stay straight from its overview card", async () => {
    mockTab = "overview"
    cat.getFavorites.mockResolvedValue([favorite])
    const user = userEvent.setup()
    await renderDashboard("Upcoming Reservation")

    const card = screen
      .getByRole("heading", { name: "Amora Lodge" })
      .closest(".group") as HTMLElement
    await user.click(card.querySelector("button") as HTMLElement)

    await waitFor(() =>
      expect(cat.removeFavorite).toHaveBeenCalledWith("h-fav"),
    )
  }, 15000)

  it("jumps from the overview hero to the reservations ledger", async () => {
    mockTab = "overview"
    const user = userEvent.setup()
    await renderDashboard("Upcoming Reservation")

    await user.click(screen.getByRole("button", { name: /View All Stays/ }))

    expect(mockPush).toHaveBeenCalledWith("/dashboard?tab=bookings")
  }, 15000)

  it("offers the search page when there is nothing to show yet", async () => {
    mockTab = "overview"
    await renderDashboard("Upcoming Reservation")

    expect(
      screen.getByText(
        "You have no active stays scheduled. Explore our handpicked collection of luxury suites across Ethiopia.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Discover Stays/ }),
    ).toHaveAttribute("href", "/search")
    expect(book.getMyBookings).toHaveBeenCalled()
  }, 15000)
})
