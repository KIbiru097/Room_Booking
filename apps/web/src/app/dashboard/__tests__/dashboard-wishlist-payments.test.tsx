import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import CustomerDashboardPage from "@/app/dashboard/page"
import { useAuth } from "@/lib/auth-store"
import { catalogService } from "@/services/catalog.service"
import { paymentService } from "@/services/payment.service"
import { authService } from "@/services/auth.service"
import type { User } from "@/lib/types"

let mockTab = "wishlist"
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

jest.mock("@/services/auth.service", () => ({
  authService: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    uploadProfilePhoto: jest.fn(),
  },
}))

const cat = catalogService as unknown as Record<string, jest.Mock>
const pay = paymentService as unknown as Record<string, jest.Mock>
const auth = authService as unknown as Record<string, jest.Mock>

const customerUser: User = {
  id: "u-ada",
  email: "ada@luxstay.test",
  fullName: "Ada Worku",
  role: "CUSTOMER",
  isActive: true,
  createdAt: "2026-01-05T00:00:00.000Z",
}

const favorite = {
  id: "h-fav",
  name: "Amora Lodge",
  primaryImageUrl: null,
  minPricePerNight: 3200,
  city: { name: "Addis Ababa", country: { name: "Ethiopia" } },
}

const payment = {
  id: "pay-00000001",
  bookingId: "bk-upcoming-0001",
  providerRef: "ch_9f2c",
  method: "CARD",
  amount: 8400,
  status: "SUCCEEDED",
  createdAt: "2026-10-01T12:00:00.000Z",
  booking: {
    id: "bk-upcoming-0001",
    hotel: { id: "h1", name: "Skylight Hotel" },
  },
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
  mockTab = "wishlist"
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

  cat.getFavorites.mockResolvedValue([favorite])
  cat.getMyReviews.mockResolvedValue([])
  cat.removeFavorite.mockResolvedValue(undefined)
  pay.getMyPayments.mockResolvedValue({ data: [payment] })
  auth.updateProfile.mockResolvedValue({
    ...customerUser,
    fullName: "Ada Worku T",
  })
  auth.uploadProfilePhoto.mockResolvedValue(customerUser)

  useAuth
    .getState()
    .setSession({ user: customerUser, accessToken: "at", refreshToken: "rt" })
})

describe("CustomerDashboardPage wishlist, payments, reviews and profile", () => {
  it("removes a saved stay from the wishlist", async () => {
    const user = userEvent.setup()
    await renderDashboard("Saved Stays")

    expect(
      screen.getByRole("heading", { name: "Amora Lodge" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Addis Ababa, Ethiopia")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Remove from saved" }))

    await waitFor(() =>
      expect(cat.removeFavorite).toHaveBeenCalledWith("h-fav"),
    )
  }, 15000)

  it("shows the empty wishlist state", async () => {
    cat.getFavorites.mockResolvedValue([])
    await renderDashboard("Saved Stays")

    expect(
      await screen.findByRole("heading", { name: "No Saved Stays" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Save your favorite properties while searching to quickly revisit and compare them here.",
      ),
    ).toBeInTheDocument()
  }, 15000)

  it("lists recorded transactions in the payment ledger", async () => {
    mockTab = "payments"
    await renderDashboard("Payment Ledger")

    expect(screen.getByText("Skylight Hotel")).toBeInTheDocument()
    expect(screen.getByText(/ch_9f2c/)).toBeInTheDocument()
    expect(pay.getMyPayments).toHaveBeenCalled()
  }, 15000)

  it("shows the empty payment ledger state", async () => {
    mockTab = "payments"
    pay.getMyPayments.mockResolvedValue({ data: [] })
    await renderDashboard("Payment Ledger")

    expect(
      screen.getByText("No payment transactions recorded on your account yet."),
    ).toBeInTheDocument()
  }, 15000)

  it("shows the empty verified reviews state", async () => {
    mockTab = "reviews"
    await renderDashboard("My Verified Reviews")

    expect(
      screen.getByRole("heading", { name: "No Reviews Published" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Once you complete a stay at any of our hotels, you can leave a verified review to help fellow travelers.",
      ),
    ).toBeInTheDocument()
  }, 15000)

  it("saves updated personal details from the profile tab", async () => {
    mockTab = "profile"
    const user = userEvent.setup()
    await renderDashboard("Profile & Identity")

    const nameInput = screen.getByPlaceholderText("e.g. Samuel Bekele")
    await user.clear(nameInput)
    await user.type(nameInput, "Ada Worku T")
    await user.click(
      screen.getByRole("button", { name: "Save Profile Changes" }),
    )

    await waitFor(() =>
      expect(auth.updateProfile).toHaveBeenCalledWith({
        fullName: "Ada Worku T",
        phone: null,
      }),
    )
    expect(
      await screen.findByText("Personal details updated successfully!"),
    ).toBeInTheDocument()
  }, 15000)
})
