import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import BookingFlowPage from "@/app/booking/[hotelId]/page"
import { useHotelQuery, useHotelRoomsQuery } from "@/hooks/use-catalog"
import {
  useCheckoutQuoteQuery,
  useCreateBookingMutation,
  useCreateHoldMutation,
  useReleaseHoldMutation,
} from "@/hooks/use-booking"
import {
  useCreatePaymentIntentMutation,
  useMockPaymentCallbackMutation,
  usePaymentStatusPolling,
} from "@/hooks/use-payment"
import { useAuth } from "@/lib/auth-store"
import { discoverApi } from "@/lib/services"
import type { BookingQuote } from "@/lib/types"

const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/booking/h1",
  useParams: () => ({ hotelId: "h1" }),
  useSearchParams: () =>
    new URLSearchParams(
      "checkIn=2026-06-10&checkOut=2026-06-14&guests=2&room=r2",
    ),
}))

jest.mock("@/hooks/use-catalog", () => ({
  useHotelQuery: jest.fn(),
  useHotelRoomsQuery: jest.fn(),
}))

jest.mock("@/hooks/use-booking", () => ({
  useCheckoutQuoteQuery: jest.fn(),
  useCreateBookingMutation: jest.fn(),
  useCreateHoldMutation: jest.fn(),
  useReleaseHoldMutation: jest.fn(),
}))

jest.mock("@/hooks/use-payment", () => ({
  useCreatePaymentIntentMutation: jest.fn(),
  useMockPaymentCallbackMutation: jest.fn(),
  usePaymentStatusPolling: jest.fn(),
}))

jest.mock("@/lib/services", () => ({
  discoverApi: { nearby: jest.fn() },
  tripApi: { list: jest.fn(), addItem: jest.fn() },
}))

const mockHotel = useHotelQuery as jest.Mock
const mockRooms = useHotelRoomsQuery as jest.Mock
const mockQuote = useCheckoutQuoteQuery as jest.Mock
const mockCreateHold = useCreateHoldMutation as jest.Mock
const mockReleaseHold = useReleaseHoldMutation as jest.Mock
const mockCreateBooking = useCreateBookingMutation as jest.Mock
const mockCreateIntent = useCreatePaymentIntentMutation as jest.Mock
const mockMockPayment = useMockPaymentCallbackMutation as jest.Mock
const mockPolling = usePaymentStatusPolling as jest.Mock

const HOTEL = {
  id: "h1",
  name: "Sheraton Addis",
  description: "A palatial retreat.",
  address: "12 Bole Road",
  city: { id: "addis", name: "Addis Ababa", country: { name: "Ethiopia" } },
  starRating: 5,
  amenities: [],
  images: [
    { id: "i1", url: "https://images.example/one.jpg", isPrimary: true },
  ],
  lat: 9.01,
  lng: 38.74,
}

const ROOMS = [
  {
    id: "r2",
    roomNumber: "102",
    type: "DELUXE",
    capacity: 2,
    beds: 2,
    bathroom: 1,
    basePrice: 1500,
    status: "AVAILABLE",
    amenities: [],
    availableAcrossRange: true,
  },
]

const QUOTE: BookingQuote = {
  hotel: { id: "h1", name: "Sheraton Addis" },
  checkIn: "2026-06-10",
  checkOut: "2026-06-14",
  nights: 4,
  rooms: [],
  subtotal: 6000,
  taxRate: 0.15,
  taxAmount: 900,
  serviceFee: 300,
  discount: 0,
  total: 7200,
} as unknown as BookingQuote

const BOOKING = {
  id: "bk-9001",
  userId: "u1",
  hotelId: "h1",
  checkIn: "2026-06-10",
  checkOut: "2026-06-14",
  status: "CONFIRMED",
  totalPrice: 7200,
  createdAt: "2026-05-01T10:00:00.000Z",
}

const CUSTOMER = {
  id: "u1",
  email: "guest@example.com",
  fullName: "Guest One",
  role: "CUSTOMER" as const,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

let holdAsync: jest.Mock
let bookingAsync: jest.Mock
let intentAsync: jest.Mock
let gatewayAsync: jest.Mock
let refetchRooms: jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
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
  holdAsync = jest.fn().mockResolvedValue({ id: "hold-1" })
  bookingAsync = jest.fn()
  intentAsync = jest.fn().mockResolvedValue({})
  gatewayAsync = jest.fn().mockResolvedValue({})
  refetchRooms = jest.fn()
  mockHotel.mockReturnValue({ data: HOTEL, isLoading: false })
  mockRooms.mockReturnValue({
    data: ROOMS,
    isLoading: false,
    refetch: refetchRooms,
  })
  mockQuote.mockReturnValue({ data: QUOTE, isLoading: false, error: null })
  mockCreateHold.mockReturnValue({ mutateAsync: holdAsync })
  mockReleaseHold.mockReturnValue({
    mutateAsync: jest.fn().mockResolvedValue(undefined),
  })
  mockCreateBooking.mockReturnValue({ mutateAsync: bookingAsync })
  mockCreateIntent.mockReturnValue({ mutateAsync: intentAsync })
  mockMockPayment.mockReturnValue({ mutateAsync: gatewayAsync })
  mockPolling.mockReturnValue({ data: null })
  ;(discoverApi.nearby as jest.Mock).mockResolvedValue({ data: [], total: 0 })
  useAuth
    .getState()
    .setSession({ user: CUSTOMER, accessToken: "a", refreshToken: "r" })
})

async function goToPayment(user: ReturnType<typeof userEvent.setup>) {
  render(<BookingFlowPage />)
  await screen.findByRole("heading", { level: 1, name: "Choose Your Suite" })
  await user.click(
    screen.getByRole("button", { name: /Continue to Guest Info/ }),
  )
  await screen.findByRole("heading", { level: 1, name: "Guest Information" })
  await user.click(screen.getByRole("button", { name: /Continue to Payment/ }))
  await screen.findByRole("heading", { level: 1, name: "Payment Method" })
}

describe("booking wizard - guest information step", () => {
  it("acquires a room hold and shows the countdown when continuing", async () => {
    const user = userEvent.setup()
    render(<BookingFlowPage />)
    await screen.findByRole("heading", { level: 1, name: "Choose Your Suite" })

    await user.click(
      screen.getByRole("button", { name: /Continue to Guest Info/ }),
    )

    expect(holdAsync).toHaveBeenCalledWith({
      roomId: "r2",
      checkIn: "2026-06-10",
      checkOut: "2026-06-14",
    })
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Guest Information",
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole("timer")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Back/ })).toBeInTheDocument()
  })

  it("still advances to guest info when the hold endpoint fails", async () => {
    holdAsync.mockRejectedValue(new Error("Hold service down"))
    const user = userEvent.setup()
    render(<BookingFlowPage />)
    await screen.findByRole("heading", { level: 1, name: "Choose Your Suite" })

    await user.click(
      screen.getByRole("button", { name: /Continue to Guest Info/ }),
    )

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Guest Information",
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole("timer")).toBeInTheDocument()
  })

  it("pre-fills guest fields from the signed-in profile", async () => {
    const user = userEvent.setup()
    render(<BookingFlowPage />)
    await screen.findByRole("heading", { level: 1, name: "Choose Your Suite" })

    await user.click(
      screen.getByRole("button", { name: /Continue to Guest Info/ }),
    )
    await screen.findByRole("heading", { level: 1, name: "Guest Information" })

    expect(screen.getByDisplayValue("Guest One")).toBeInTheDocument()
    expect(screen.getByDisplayValue("guest@example.com")).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("Legal First and Last Name"),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Your booking confirmation receipt and PDF invoice will be routed here.",
      ),
    ).toBeInTheDocument()
  })

  it("blocks progress until a guest name is provided", async () => {
    const user = userEvent.setup()
    render(<BookingFlowPage />)
    await screen.findByRole("heading", { level: 1, name: "Choose Your Suite" })
    await user.click(
      screen.getByRole("button", { name: /Continue to Guest Info/ }),
    )
    await screen.findByRole("heading", { level: 1, name: "Guest Information" })

    await user.clear(screen.getByDisplayValue("Guest One"))
    await user.click(
      screen.getByRole("button", { name: /Continue to Payment/ }),
    )

    expect(screen.getByText("Guest full name is required.")).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { level: 1, name: "Payment Method" }),
    ).not.toBeInTheDocument()
  })

  it("blocks progress until a valid guest email is provided", async () => {
    const user = userEvent.setup()
    render(<BookingFlowPage />)
    await screen.findByRole("heading", { level: 1, name: "Choose Your Suite" })
    await user.click(
      screen.getByRole("button", { name: /Continue to Guest Info/ }),
    )
    await screen.findByRole("heading", { level: 1, name: "Guest Information" })

    await user.clear(screen.getByDisplayValue("guest@example.com"))
    await user.click(
      screen.getByRole("button", { name: /Continue to Payment/ }),
    )

    expect(
      screen.getByText("A valid guest email address is required."),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { level: 1, name: "Payment Method" }),
    ).not.toBeInTheDocument()
  })
})

describe("booking wizard - payment step", () => {
  it("shows gateway-specific inputs as the payment method changes", async () => {
    const user = userEvent.setup()
    await goToPayment(user)

    expect(screen.getByDisplayValue("4242 •••• •••• 4242")).toBeInTheDocument()
    expect(screen.getByText("Cardholder Details")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Telebirr" }))
    expect(screen.getByText("Telebirr Mobile Payment")).toBeInTheDocument()
    expect(screen.getByDisplayValue("0911234567")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "CBE Birr" }))
    expect(
      screen.getByText("Commercial Bank of Ethiopia (CBE Birr)"),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cash at Hotel" }))
    expect(screen.getByText("Pay at Hotel Front Desk")).toBeInTheDocument()
    expect(screen.queryByLabelText("Card Number")).not.toBeInTheDocument()
  })

  it("creates the booking, authorizes the card, and shows the confirmation", async () => {
    bookingAsync.mockResolvedValue(BOOKING)
    const user = userEvent.setup()
    await goToPayment(user)

    await user.click(screen.getByRole("button", { name: /Confirm & Pay/ }))

    await waitFor(() =>
      expect(bookingAsync).toHaveBeenCalledWith({
        hotelId: "h1",
        roomIds: ["r2"],
        checkIn: "2026-06-10",
        checkOut: "2026-06-14",
        guests: { adults: 2, children: 0 },
        guestInfos: [
          {
            fullName: "Guest One",
            email: "guest@example.com",
            phone: "N/A",
          },
        ],
        paymentMethod: "CREDIT_CARD",
        bookingSource: "ONLINE",
      }),
    )
    expect(intentAsync).toHaveBeenCalledWith({
      bookingId: "bk-9001",
      method: "CREDIT_CARD",
    })
    expect(gatewayAsync).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: "bk-9001" }),
    )

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Reservation Confirmed",
      }),
    ).toBeInTheDocument()
    expect(screen.getByText("bk-9001")).toBeInTheDocument()
    expect(screen.getByText("ETB 7,200")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /View in My Bookings/ }),
    ).toHaveAttribute("href", "/dashboard")
  })

  it("confirms cash bookings without calling the payment gateway", async () => {
    bookingAsync.mockResolvedValue(BOOKING)
    const user = userEvent.setup()
    await goToPayment(user)

    await user.click(screen.getByRole("button", { name: "Cash at Hotel" }))
    await user.click(screen.getByRole("button", { name: /Confirm & Pay/ }))

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Reservation Confirmed",
      }),
    ).toBeInTheDocument()
    expect(intentAsync).toHaveBeenCalledWith({
      bookingId: "bk-9001",
      method: "CASH",
    })
    expect(gatewayAsync).not.toHaveBeenCalled()
  })

  it("waits for mobile confirmation on Telebirr and resolves on simulated approval", async () => {
    bookingAsync.mockResolvedValue(BOOKING)
    const user = userEvent.setup()
    await goToPayment(user)

    await user.click(screen.getByRole("button", { name: "Telebirr" }))
    await user.click(screen.getByRole("button", { name: /Confirm & Pay/ }))

    expect(
      await screen.findByText("Awaiting Confirmation from Mobile Gateway"),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "We have dispatched the transaction to your mobile wallet. Polling status automatically...",
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", {
        level: 1,
        name: "Reservation Confirmed",
      }),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Simulate Instant Mobile Approval" }),
    )

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Reservation Confirmed",
      }),
    ).toBeInTheDocument()
    expect(gatewayAsync).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: "bk-9001" }),
    )
  })

  it("returns to suite selection with preserved guest details on a 409 conflict", async () => {
    bookingAsync.mockRejectedValue(
      Object.assign(new Error("Inventory taken"), { status: 409 }),
    )
    const user = userEvent.setup()
    await goToPayment(user)

    await user.click(screen.getByRole("button", { name: /Confirm & Pay/ }))

    expect(
      await screen.findByText("Inventory Conflict Detected"),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Room Unavailable: Another traveler just secured this suite/,
      ),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Choose Your Suite",
      }),
    ).toBeInTheDocument()
    expect(refetchRooms).toHaveBeenCalled()

    await user.click(
      screen.getByRole("button", { name: /Continue to Guest Info/ }),
    )
    await screen.findByRole("heading", { level: 1, name: "Guest Information" })
    expect(screen.getByDisplayValue("Guest One")).toBeInTheDocument()
    expect(screen.getByDisplayValue("guest@example.com")).toBeInTheDocument()
  })

  it("surfaces other payment failures in a dismissible banner", async () => {
    bookingAsync.mockRejectedValue(new Error("Card declined by issuer"))
    const user = userEvent.setup()
    await goToPayment(user)

    await user.click(screen.getByRole("button", { name: /Confirm & Pay/ }))

    expect(
      await screen.findByText("Card declined by issuer"),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    )
    expect(
      screen.queryByText("Card declined by issuer"),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 1, name: "Payment Method" }),
    ).toBeInTheDocument()
  })

  it("navigates back to the previous step without losing the wizard state", async () => {
    const user = userEvent.setup()
    await goToPayment(user)

    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Guest Information",
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Choose Your Suite",
      }),
    ).toBeInTheDocument()
    expect(screen.queryByRole("timer")).not.toBeInTheDocument()
  })

  it("blocks payment once the room hold has expired", async () => {
    jest.useFakeTimers()
    try {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<BookingFlowPage />)
      await screen.findByRole("heading", {
        level: 1,
        name: "Choose Your Suite",
      })
      await user.click(
        screen.getByRole("button", { name: /Continue to Guest Info/ }),
      )
      await screen.findByRole("heading", {
        level: 1,
        name: "Guest Information",
      })
      await user.click(
        screen.getByRole("button", { name: /Continue to Payment/ }),
      )
      await screen.findByRole("heading", { level: 1, name: "Payment Method" })

      await act(async () => {
        jest.advanceTimersByTime(15 * 60 * 1000)
      })

      expect(
        screen.getByText(
          "Your 15-minute room hold has expired. Please re-check room hold to continue.",
        ),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /Confirm & Pay/ }),
      ).toBeDisabled()
    } finally {
      jest.useRealTimers()
    }
  })
})
