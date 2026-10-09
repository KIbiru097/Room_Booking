import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import PaymentHistoryPage from "@/app/payment-history/page"
import { paymentService } from "@/services/payment.service"
import { bookingService } from "@/services/booking.service"
import type { Payment } from "@/lib/types"
import { useAuth } from "@/lib/auth-store"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/payment-history",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(""),
}))

jest.mock("@/services/payment.service", () => ({
  paymentService: { getMyPayments: jest.fn() },
}))

jest.mock("@/services/booking.service", () => ({
  bookingService: { downloadInvoice: jest.fn() },
}))

const mockedPayments = paymentService as jest.Mocked<typeof paymentService>
const mockedBooking = bookingService as jest.Mocked<typeof bookingService>

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay-1",
    bookingId: "bk-100",
    method: "Telebirr",
    amount: 1200,
    status: "SUCCEEDED",
    createdAt: "2026-01-15T10:30:00.000Z",
    booking: { id: "bk-100", hotel: { id: "h1", name: "Sheraton Addis" } },
    ...overrides,
  }
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={client}>
      <PaymentHistoryPage />
    </QueryClientProvider>,
  )
}

describe("payment history page", () => {
  beforeEach(() => {
    localStorage.clear()
    useAuth.setState({
      user: {
        id: "u1",
        email: "guest@example.com",
        fullName: "Guest User",
        role: "CUSTOMER",
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      isInitialized: true,
      isCustomer: true,
    })
    mockedPayments.getMyPayments.mockReset()
    mockedBooking.downloadInvoice.mockReset()
    mockedBooking.downloadInvoice.mockResolvedValue(undefined)
  })

  it("shows the finance header, zero count and skeletons while loading", () => {
    mockedPayments.getMyPayments.mockReturnValue(new Promise(() => undefined))

    const { container } = renderPage()

    expect(
      screen.getByRole("heading", { name: "Payment history" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Review completed and pending payments for your stays."),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Back to dashboard/ }),
    ).toHaveAttribute("href", "/dashboard?tab=payments")
    expect(
      screen.getByText("Payments").closest("div")?.parentElement,
    ).toHaveTextContent("0")
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3)
  })

  it("reports a failed load with a retry that re-queries", async () => {
    const user = userEvent.setup()
    mockedPayments.getMyPayments.mockRejectedValueOnce(new Error("boom"))

    renderPage()

    expect(
      await screen.findByText("Unable to load payment history."),
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Try again" }))
    await waitFor(() =>
      expect(mockedPayments.getMyPayments).toHaveBeenCalledTimes(2),
    )
  })

  it("renders the empty state when there are no records", async () => {
    mockedPayments.getMyPayments.mockResolvedValue({ data: [] })

    renderPage()

    expect(await screen.findByText("No payments yet")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Your payment records will appear here after you reserve a stay.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Explore hotels" }),
    ).toHaveAttribute("href", "/search")
    expect(
      screen.queryByRole("button", { name: /Invoice/ }),
    ).not.toBeInTheDocument()
  })

  it("lists each payment with amount, status and booking reference", async () => {
    mockedPayments.getMyPayments.mockResolvedValue({
      data: [
        makePayment(),
        makePayment({
          id: "pay-2",
          bookingId: "bk-101",
          method: "CBE Birr",
          amount: 2450.5,
          status: "FAILED",
          booking: {
            id: "bk-101",
            hotel: { id: "h2", name: "Lalibela Lodge" },
          },
        }),
        makePayment({
          id: "pay-3",
          bookingId: "bk-102",
          method: "Card",
          amount: 800,
          status: "PENDING",
          booking: undefined,
        }),
      ],
    })

    renderPage()

    expect(await screen.findByText("Sheraton Addis")).toBeInTheDocument()
    expect(screen.getByText("Lalibela Lodge")).toBeInTheDocument()
    expect(screen.getByText("Hotel booking")).toBeInTheDocument()

    expect(screen.getAllByText(/^ETB/)).toHaveLength(3)
    expect(screen.getByText("ETB 1,200")).toBeInTheDocument()
    expect(screen.getByText("ETB 2,450.5")).toBeInTheDocument()
    expect(screen.getByText("ETB 800")).toBeInTheDocument()

    expect(screen.getByText("Succeeded")).toBeInTheDocument()
    expect(screen.getByText("Failed")).toBeInTheDocument()
    expect(screen.getByText("Pending")).toBeInTheDocument()

    expect(screen.getByText("Booking bk-100")).toBeInTheDocument()
    expect(screen.getByText("Booking bk-102")).toBeInTheDocument()
    expect(screen.getByText(/· Telebirr$/)).toBeInTheDocument()

    const badge = screen.getByText("Payments").closest("div")?.parentElement
    expect(badge).toHaveTextContent("3")
  })

  it("downloads an invoice and blocks repeat taps while it runs", async () => {
    const user = userEvent.setup()
    let release: (value: void) => void = () => undefined
    mockedBooking.downloadInvoice.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve
        }),
    )
    mockedPayments.getMyPayments.mockResolvedValue({ data: [makePayment()] })

    renderPage()

    const invoice = await screen.findByRole("button", { name: /Invoice/ })
    await user.click(invoice)

    expect(mockedBooking.downloadInvoice).toHaveBeenCalledWith("bk-100")
    expect(invoice).toBeDisabled()

    release()
    await waitFor(() => expect(invoice).toBeEnabled())
  })

  it("keeps the invoice action unavailable without a booking reference", async () => {
    mockedPayments.getMyPayments.mockResolvedValue({
      data: [makePayment({ bookingId: "" })],
    })

    renderPage()

    const invoice = await screen.findByRole("button", { name: /Invoice/ })
    expect(invoice).toBeDisabled()
    expect(mockedBooking.downloadInvoice).not.toHaveBeenCalled()
  })
})
