import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import BookingFlowPage from "@/app/booking/[hotelId]/page"
import { useHotelQuery, useHotelRoomsQuery } from "@/hooks/use-catalog"
import {
  useCheckoutQuoteQuery,
  useCreateHoldMutation,
  useReleaseHoldMutation,
  useCreateBookingMutation,
} from "@/hooks/use-booking"
import {
  useCreatePaymentIntentMutation,
  useMockPaymentCallbackMutation,
  usePaymentStatusPolling,
} from "@/hooks/use-payment"
import { useAuth } from "@/lib/auth-store"
import { useToastStore } from "@/components/ui/Toast"
import { discoverApi, tripApi } from "@/lib/services"
import type { BookingQuote } from "@/lib/types"
import type { PlaceItem, Trip } from "@/lib/services"

let mockSearch = "checkIn=2026-06-10&checkOut=2026-06-14&guests=3&room=r2"
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
  useSearchParams: () => new URLSearchParams(mockSearch),
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
const mockNearby = discoverApi.nearby as jest.Mock
const mockTrips = tripApi.list as jest.Mock
const mockAddItem = tripApi.addItem as jest.Mock

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
    amenities: ["Wi-Fi", "Mini Bar"],
    availableAcrossRange: true,
  },
  {
    id: "r3",
    roomNumber: "103",
    type: "PRESIDENTIAL",
    capacity: 4,
    beds: 3,
    bathroom: 2,
    basePrice: 4000,
    status: "AVAILABLE",
    amenities: ["Balcony"],
    availableAcrossRange: true,
  },
  {
    id: "r4",
    roomNumber: "104",
    type: "STANDARD",
    capacity: 2,
    beds: 1,
    bathroom: 1,
    basePrice: 900,
    status: "UNAVAILABLE",
    amenities: [],
    availableAcrossRange: false,
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

const PLACE: PlaceItem = {
  id: "p1",
  name: "Tomoca Coffee",
  description: "Historic espresso bar.",
  category: "CAFE",
  status: "ACTIVE",
  address: "Wanzéte Yilma St",
  lat: 9.01,
  lng: 38.75,
  hoursVerified: true,
  images: [],
  distanceKm: 0.6,
}

const TRIP: Trip = {
  id: "trip-1",
  title: "Addis Weekend",
  startDate: "2026-06-01T00:00:00.000Z",
  endDate: "2026-06-30T00:00:00.000Z",
  timezone: "Africa/Addis_Ababa",
  items: [],
}

const CUSTOMER = {
  id: "u1",
  email: "guest@example.com",
  fullName: "Guest One",
  role: "CUSTOMER" as const,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  useToastStore.setState({ toasts: [] })
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
  mockSearch = "checkIn=2026-06-10&checkOut=2026-06-14&guests=3&room=r2"
  mockHotel.mockReturnValue({ data: HOTEL, isLoading: false })
  mockRooms.mockReturnValue({
    data: ROOMS,
    isLoading: false,
    refetch: jest.fn(),
  })
  mockQuote.mockReturnValue({ data: QUOTE, isLoading: false, error: null })
  mockCreateHold.mockReturnValue({
    mutateAsync: jest.fn().mockResolvedValue({ id: "hold-1" }),
  })
  mockReleaseHold.mockReturnValue({
    mutateAsync: jest.fn().mockResolvedValue(undefined),
  })
  mockCreateBooking.mockReturnValue({ mutateAsync: jest.fn() })
  mockCreateIntent.mockReturnValue({
    mutateAsync: jest.fn().mockResolvedValue({}),
  })
  mockMockPayment.mockReturnValue({
    mutateAsync: jest.fn().mockResolvedValue({}),
  })
  mockPolling.mockReturnValue({ data: null })
  mockNearby.mockResolvedValue({ data: [PLACE], total: 1 })
  mockTrips.mockResolvedValue({ data: [TRIP], total: 1 })
  mockAddItem.mockResolvedValue({
    item: {},
    hasConflict: false,
    conflictWith: [],
  })
  useAuth
    .getState()
    .setSession({ user: CUSTOMER, accessToken: "a", refreshToken: "r" })
})

describe("booking wizard - suite selection and quotes", () => {
  it("shows a skeleton while the hotel is loading", () => {
    mockHotel.mockReturnValue({ data: undefined, isLoading: true })

    const { container } = render(<BookingFlowPage />)

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    )
    expect(
      screen.queryByRole("heading", { name: "Choose Your Suite" }),
    ).not.toBeInTheDocument()
  })

  it("redirects signed-out visitors to sign in with a return path", async () => {
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
    render(<BookingFlowPage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/auth?returnTo=%2F"),
    )
  })

  it("pre-fills dates and guests from the search params and lists available suites", async () => {
    render(<BookingFlowPage />)

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Choose Your Suite",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Select an available room at Sheraton Addis for your stay dates.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue("2026-06-10")).toBeInTheDocument()
    expect(screen.getByDisplayValue("2026-06-14")).toBeInTheDocument()
    expect(screen.getByDisplayValue("3")).toBeInTheDocument()

    expect(screen.getByRole("heading", { name: "DELUXE" })).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "PRESIDENTIAL" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "STANDARD" }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText("Room #102 · 2 beds · Up to 2 guests"),
    ).toBeInTheDocument()
    expect(screen.getByText("ETB 4,000")).toBeInTheDocument()
    expect(
      screen.queryByText(
        "No suites available for the selected dates. Please adjust your check-in or check-out dates.",
      ),
    ).not.toBeInTheDocument()
  })

  it("quotes the suite selected through the search params", async () => {
    render(<BookingFlowPage />)
    await screen.findByRole("heading", { level: 1, name: "Choose Your Suite" })

    expect(mockQuote).toHaveBeenCalledWith(
      {
        hotelId: "h1",
        roomIds: ["r2"],
        checkIn: "2026-06-10",
        checkOut: "2026-06-14",
        guests: { adults: 3, children: 0 },
        promoCode: undefined,
      },
      true,
    )
    expect(mockRooms).toHaveBeenCalledWith("h1", {
      startDate: "2026-06-10",
      endDate: "2026-06-14",
    })
  })

  it("re-quotes when a different suite card is clicked", async () => {
    const user = userEvent.setup()
    render(<BookingFlowPage />)
    await screen.findByRole("heading", { level: 1, name: "Choose Your Suite" })

    await user.click(screen.getByRole("heading", { name: "PRESIDENTIAL" }))

    await waitFor(() =>
      expect(mockQuote).toHaveBeenLastCalledWith(
        expect.objectContaining({ roomIds: ["r3"] }),
        true,
      ),
    )
  })

  it("re-quotes when the stay dates are adjusted", async () => {
    render(<BookingFlowPage />)
    await screen.findByRole("heading", { level: 1, name: "Choose Your Suite" })

    fireEvent.change(screen.getByDisplayValue("2026-06-14"), {
      target: { value: "2026-06-12" },
    })

    await waitFor(() =>
      expect(mockRooms).toHaveBeenLastCalledWith("h1", {
        startDate: "2026-06-10",
        endDate: "2026-06-12",
      }),
    )
    expect(mockQuote).toHaveBeenLastCalledWith(
      expect.objectContaining({ checkOut: "2026-06-12" }),
      true,
    )
  })

  it("uppercases and forwards an applied promo code to the quote", async () => {
    const user = userEvent.setup()
    render(<BookingFlowPage />)
    await screen.findByRole("heading", { level: 1, name: "Choose Your Suite" })

    await user.type(
      screen.getByPlaceholderText("Enter Promo Code (e.g. LUXSTAY20)"),
      "luxstay20",
    )
    await user.click(screen.getByRole("button", { name: "Apply Code" }))

    await waitFor(() =>
      expect(mockQuote).toHaveBeenLastCalledWith(
        expect.objectContaining({ promoCode: "LUXSTAY20" }),
        true,
      ),
    )
  })

  it("shows the authoritative price breakdown from the quote", async () => {
    render(<BookingFlowPage />)

    expect(await screen.findByText("Room Subtotal")).toBeInTheDocument()
    expect(screen.getByText("ETB 6,000")).toBeInTheDocument()
    expect(screen.getByText("Value Added Tax (15%)")).toBeInTheDocument()
    expect(screen.getByText("ETB 900")).toBeInTheDocument()
    expect(screen.getByText("Hotel Hospitality Fee (5%)")).toBeInTheDocument()
    expect(screen.getByText("ETB 300")).toBeInTheDocument()
    expect(screen.getByText("Total Price")).toBeInTheDocument()
    expect(screen.getAllByText("ETB 7,200").length).toBeGreaterThan(0)
    expect(
      screen.getByText("Guaranteed booking with 256-bit encrypted checkout."),
    ).toBeInTheDocument()
  })

  it("shows the empty state when no suite is available for the dates", async () => {
    mockSearch = "checkIn=2026-06-10&checkOut=2026-06-14&guests=3"
    mockRooms.mockReturnValue({
      data: [],
      isLoading: false,
      refetch: jest.fn(),
    })
    mockQuote.mockReturnValue({ data: null, isLoading: false, error: null })

    render(<BookingFlowPage />)
    await screen.findByRole("heading", { level: 1, name: "Choose Your Suite" })

    expect(
      screen.getByText(
        "No suites available for the selected dates. Please adjust your check-in or check-out dates.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Continue to Guest Info/ }),
    ).toBeDisabled()
  })
})

describe("booking wizard - nearby places", () => {
  it("renders what is around the hotel with navigation links", async () => {
    render(<BookingFlowPage />)

    expect(
      await screen.findByRole("heading", { name: "What's around this hotel?" }),
    ).toBeInTheDocument()
    expect(mockNearby).toHaveBeenCalledWith({
      lat: 9.01,
      lng: 38.74,
      radiusKm: 10,
      limit: 6,
    })
    expect(screen.getByRole("link", { name: "Tomoca Coffee" })).toHaveAttribute(
      "href",
      "/discover/p1",
    )
    expect(
      screen.getByText("CAFE · 600m · Verified source"),
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Browse all/ })).toHaveAttribute(
      "href",
      "/discover",
    )
  })

  it("shows the nearby lookup failure without blocking checkout", async () => {
    mockNearby.mockRejectedValue(new Error("Directory down"))
    render(<BookingFlowPage />)

    expect(
      await screen.findByText(
        "Directory down. You can continue booking or browse Discover later.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 1, name: "Choose Your Suite" }),
    ).toBeInTheDocument()
  })

  it("saves a nearby place onto the first trip", async () => {
    const user = userEvent.setup()
    render(<BookingFlowPage />)
    await screen.findByRole("heading", { name: "What's around this hotel?" })

    await user.click(screen.getByRole("button", { name: "Save to trip" }))

    await waitFor(() =>
      expect(mockAddItem).toHaveBeenCalledWith("trip-1", {
        itemType: "PLACE",
        placeId: "p1",
        title: "Visit Tomoca Coffee",
        dayDate: "2026-06-10",
        startTime: "10:00",
        durationMin: 90,
        currency: "ETB",
      }),
    )
    expect(useToastStore.getState().toasts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "success",
          title: "Saved to My Trip",
          message: "Tomoca Coffee was added to Addis Weekend.",
        }),
      ]),
    )
  })

  it("requires sign in before saving a nearby place", async () => {
    const user = userEvent.setup()
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
    render(<BookingFlowPage />)
    await screen.findByRole("heading", { name: "What's around this hotel?" })

    await user.click(screen.getByRole("button", { name: "Save to trip" }))

    expect(mockTrips).not.toHaveBeenCalled()
    expect(useToastStore.getState().toasts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "info",
          title: "Sign in required",
          message: "Sign in to save places to your trip.",
        }),
      ]),
    )
  })
})
