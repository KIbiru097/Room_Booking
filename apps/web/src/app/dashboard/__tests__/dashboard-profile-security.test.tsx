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
import { authService } from "@/services/auth.service"
import { bookingService } from "@/services/booking.service"
import { catalogService } from "@/services/catalog.service"
import { paymentService } from "@/services/payment.service"
import type { User } from "@/lib/types"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams("tab=profile"),
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

jest.mock("@/services/auth.service", () => ({
  authService: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    uploadProfilePhoto: jest.fn(),
  },
}))

const book = bookingService as unknown as Record<string, jest.Mock>
const auth = authService as unknown as Record<string, jest.Mock>
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

const renderProfile = async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const view = render(
    <QueryClientProvider client={client}>
      <CustomerDashboardPage />
    </QueryClientProvider>,
  )
  await screen.findByRole("heading", { name: "Welcome, Ada" })
  await screen.findByRole("heading", { name: "Profile & Identity" })
  return view
}

const fileInput = () =>
  document.querySelector('input[type="file"]') as HTMLInputElement

const uploadFile = (file: File) => {
  Object.defineProperty(fileInput(), "files", {
    configurable: true,
    value: [file],
  })
  fireEvent.change(fileInput())
}

const feedbackDismiss = async (message: string) => {
  const span = await screen.findByText(message)
  await userEvent.click(
    within(span.parentElement as HTMLElement).getByRole("button"),
  )
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

  book.getMyBookings.mockResolvedValue({ data: [] })
  cat.getFavorites.mockResolvedValue([])
  cat.getMyReviews.mockResolvedValue([])
  pay.getMyPayments.mockResolvedValue({ data: [] })
  auth.updateProfile.mockResolvedValue({
    ...customerUser,
    fullName: "Ada Worku T",
  })
  auth.uploadProfilePhoto.mockResolvedValue(customerUser)

  useAuth
    .getState()
    .setSession({ user: customerUser, accessToken: "at", refreshToken: "rt" })
})

describe("CustomerDashboardPage profile photo", () => {
  it("rejects a photo that is bigger than the 5MB budget", async () => {
    await renderProfile()
    const file = new File(["x"], "huge.png", { type: "image/png" })
    Object.defineProperty(file, "size", { value: 6 * 1024 * 1024 })

    uploadFile(file)

    expect(
      await screen.findByText(
        "Image size exceeds 5MB limit. Please choose a smaller file.",
      ),
    ).toBeInTheDocument()
    expect(auth.uploadProfilePhoto).not.toHaveBeenCalled()
    await feedbackDismiss(
      "Image size exceeds 5MB limit. Please choose a smaller file.",
    )
    expect(
      screen.queryByText(
        "Image size exceeds 5MB limit. Please choose a smaller file.",
      ),
    ).not.toBeInTheDocument()
  }, 15000)

  it("rejects a non-image payload", async () => {
    await renderProfile()
    uploadFile(new File(["x"], "resume.pdf", { type: "application/pdf" }))

    expect(
      await screen.findByText("Only image files (JPG, PNG, WebP) are allowed."),
    ).toBeInTheDocument()
    expect(auth.uploadProfilePhoto).not.toHaveBeenCalled()
  }, 15000)

  it("uploads a valid photo from the header camera shortcut", async () => {
    const user = userEvent.setup()
    await renderProfile()

    await user.click(
      screen.getByRole("button", { name: "Upload new profile photo" }),
    )
    uploadFile(new File(["img"], "portrait.jpg", { type: "image/jpeg" }))

    await waitFor(() =>
      expect(auth.uploadProfilePhoto).toHaveBeenCalledTimes(1),
    )
    expect(
      await screen.findByText(
        "Profile photo uploaded and updated successfully!",
      ),
    ).toBeInTheDocument()
    expect(fileInput().value).toBe("")
  }, 15000)

  it("shows the server message when the upload fails", async () => {
    auth.uploadProfilePhoto.mockRejectedValue({
      response: { data: { message: "Please use a square crop" } },
    })
    const user = userEvent.setup()
    await renderProfile()

    await user.click(screen.getByRole("button", { name: "Upload New Photo" }))
    uploadFile(new File(["img"], "portrait.jpg", { type: "image/jpeg" }))

    expect(
      await screen.findByText("Please use a square crop"),
    ).toBeInTheDocument()
  }, 15000)
})

describe("CustomerDashboardPage personal details form", () => {
  it("refuses to save a one character name", async () => {
    const user = userEvent.setup()
    await renderProfile()

    const name = screen.getByPlaceholderText("e.g. Samuel Bekele")
    await user.clear(name)
    await user.type(name, "A")
    await user.click(
      screen.getByRole("button", { name: "Save Profile Changes" }),
    )

    expect(
      await screen.findByText("Full name must be at least 2 characters long."),
    ).toBeInTheDocument()
    expect(auth.updateProfile).not.toHaveBeenCalled()
  }, 15000)

  it("reports a rejected profile update and clears the notice", async () => {
    auth.updateProfile.mockRejectedValue(
      new Error("Display name is already taken"),
    )
    const user = userEvent.setup()
    await renderProfile()

    await user.type(
      screen.getByPlaceholderText("e.g. +251 91 123 4567"),
      "251911223344",
    )
    await user.click(
      screen.getByRole("button", { name: "Save Profile Changes" }),
    )

    await feedbackDismiss("Display name is already taken")
    expect(
      screen.queryByText("Display name is already taken"),
    ).not.toBeInTheDocument()
  }, 15000)

  it("rolls the form back to the stored values", async () => {
    const user = userEvent.setup()
    await renderProfile()

    const phone = screen.getByPlaceholderText("e.g. +251 91 123 4567")
    await user.type(phone, "+251911223344")
    expect(phone).toHaveValue("+251911223344")

    await user.click(screen.getByRole("button", { name: "Reset Changes" }))

    expect(screen.getByPlaceholderText("e.g. +251 91 123 4567")).toHaveValue("")
    expect(screen.getByPlaceholderText("e.g. Samuel Bekele")).toHaveValue(
      "Ada Worku",
    )
  }, 15000)
})

describe("CustomerDashboardPage password & session", () => {
  const fillPasswords = async (
    user: ReturnType<typeof userEvent.setup>,
    current: string,
    next: string,
    confirm: string,
  ) => {
    const fields = document.querySelectorAll<HTMLInputElement>(
      'input[placeholder="••••••••"]',
    )
    await user.clear(fields[0])
    await user.type(fields[0], current)
    await user.clear(fields[1])
    await user.type(fields[1], next)
    await user.clear(fields[2])
    await user.type(fields[2], confirm)
  }

  it("opens the password form and enforces length and matching rules", async () => {
    const user = userEvent.setup()
    await renderProfile()

    await user.click(screen.getByRole("button", { name: "Change Password" }))
    expect(screen.getByText("Current Password")).toBeInTheDocument()

    await fillPasswords(user, "old-secret-1", "short", "short")
    await user.click(screen.getByRole("button", { name: "Update Password" }))
    expect(
      await screen.findByText(
        "New password must be at least 8 characters long.",
      ),
    ).toBeInTheDocument()

    await fillPasswords(user, "old-secret-1", "brand-new-123", "different-123")
    await user.click(screen.getByRole("button", { name: "Update Password" }))
    expect(
      await screen.findByText("New passwords do not match."),
    ).toBeInTheDocument()

    await fillPasswords(user, "old-secret-1", "brand-new-123", "brand-new-123")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() =>
      expect(auth.updateProfile).toHaveBeenCalledWith({
        currentPassword: "old-secret-1",
        newPassword: "brand-new-123",
      }),
    )
    expect(
      await screen.findByText("Password changed successfully!"),
    ).toBeInTheDocument()
  }, 15000)

  it("reveals the typed secrets on demand and folds the form away again", async () => {
    const user = userEvent.setup()
    await renderProfile()

    await user.click(screen.getByRole("button", { name: "Change Password" }))
    const fields = document.querySelectorAll<HTMLInputElement>(
      'input[placeholder="••••••••"]',
    )
    expect(fields[0]).toHaveAttribute("type", "password")

    await user.click(
      fields[0].parentElement?.querySelector("button") as HTMLElement,
    )
    expect(fields[0]).toHaveAttribute("type", "text")

    await user.click(
      fields[1].parentElement?.querySelector("button") as HTMLElement,
    )
    expect(fields[1]).toHaveAttribute("type", "text")

    await user.click(screen.getByRole("button", { name: "Hide" }))
    expect(screen.queryByText("Current Password")).not.toBeInTheDocument()
  }, 15000)

  it("surfaces a rejected password change", async () => {
    auth.updateProfile.mockRejectedValue(
      new Error("Current password is incorrect"),
    )
    const user = userEvent.setup()
    await renderProfile()

    await user.click(screen.getByRole("button", { name: "Change Password" }))
    await fillPasswords(user, "wrong-secret", "brand-new-123", "brand-new-123")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    expect(
      await screen.findByText("Current password is incorrect"),
    ).toBeInTheDocument()
  }, 15000)

  it("signs the guest out of the console", async () => {
    const user = userEvent.setup()
    await renderProfile()

    await user.click(screen.getByRole("button", { name: "Sign Out" }))

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"))
    expect(useAuth.getState().user).toBeNull()
  }, 15000)
})
