import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import HotelDetailPage from "@/app/hotel/[id]/page"
import {
  useHotelQuery,
  useHotelRoomsQuery,
  useHotelPolicyQuery,
  useHotelReviewsQuery,
  useFavoritesQuery,
  useToggleFavoriteMutation,
} from "@/hooks/use-catalog"
import { useAuth } from "@/lib/auth-store"
import { useToastStore } from "@/components/ui/Toast"
import { discoverApi } from "@/lib/services"

let mockSearch = "checkIn=2026-06-10&checkOut=2026-06-14&guests=3"
const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    refresh: mockRefresh,
  }),
  usePathname: () => "/hotel/h1",
  useParams: () => ({ id: "h1" }),
  useSearchParams: () => new URLSearchParams(mockSearch),
}))

jest.mock("@/hooks/use-catalog", () => ({
  useHotelQuery: jest.fn(),
  useHotelRoomsQuery: jest.fn(),
  useHotelPolicyQuery: jest.fn(),
  useHotelReviewsQuery: jest.fn(),
  useFavoritesQuery: jest.fn(),
  useToggleFavoriteMutation: jest.fn(),
}))

jest.mock("@/lib/services", () => ({
  discoverApi: { nearby: jest.fn(), nearbyHeritage: jest.fn() },
  tripApi: { list: jest.fn(), addItem: jest.fn() },
}))

const mockHotel = useHotelQuery as jest.Mock
const mockRooms = useHotelRoomsQuery as jest.Mock
const mockPolicy = useHotelPolicyQuery as jest.Mock
const mockReviews = useHotelReviewsQuery as jest.Mock
const mockFavorites = useFavoritesQuery as jest.Mock
const mockToggle = useToggleFavoriteMutation as jest.Mock
const mockNearby = discoverApi.nearby as jest.Mock
const mockNearbyHeritage = discoverApi.nearbyHeritage as jest.Mock

const HOTEL = {
  id: "h1",
  name: "Sheraton Addis",
  description: "A palatial retreat in the heart of Bole.",
  address: "12 Bole Road",
  city: { id: "addis", name: "Addis Ababa", country: { name: "Ethiopia" } },
  starRating: 5,
  averageRating: 4.8,
  reviewCount: 128,
  amenities: ["Free Wi-Fi", "Infinity Pool"],
  images: [
    { id: "i1", url: "https://images.example/one.jpg", isPrimary: true },
    { id: "i2", url: "https://images.example/two.jpg", isPrimary: false },
  ],
  lat: 9.01,
  lng: 38.74,
}

const ROOMS = [
  {
    id: "r1",
    roomNumber: "101",
    type: "Deluxe",
    capacity: 2,
    beds: 2,
    bathroom: 1,
    basePrice: 1500,
    status: "AVAILABLE",
    amenities: ["Wi-Fi"],
    availableAcrossRange: true,
    description: "Corner view suite",
  },
  {
    id: "r2",
    roomNumber: "102",
    type: "Suite",
    capacity: 4,
    beds: 3,
    bathroom: 2,
    basePrice: 2200,
    status: "UNAVAILABLE",
    amenities: [],
    availableAcrossRange: false,
    description: "Presidential wing",
  },
]

const POLICY = {
  checkInTime: "15:00",
  checkOutTime: "10:00",
  cancellationWindowDays: 2,
}

const REVIEW = {
  id: "rev1",
  rating: 5,
  comment: "Impeccable service from arrival to departure.",
  user: { fullName: "Selamawit Bekele" },
  createdAt: "2026-03-04T10:00:00.000Z",
  response: "Thank you for staying with us.",
  respondedBy: { fullName: "Marta Girma" },
  respondedAt: "2026-03-05T09:00:00.000Z",
}

function setHotel(overrides: Record<string, unknown> = {}) {
  mockHotel.mockReturnValue({
    data: HOTEL,
    isLoading: false,
    isError: false,
    ...overrides,
  })
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
  mockSearch = "checkIn=2026-06-10&checkOut=2026-06-14&guests=3"
  setHotel()
  mockRooms.mockReturnValue({ data: ROOMS, isLoading: false })
  mockPolicy.mockReturnValue({ data: POLICY })
  mockReviews.mockReturnValue({ data: { data: [REVIEW], total: 1 } })
  mockFavorites.mockReturnValue({ data: [] })
  mockToggle.mockReturnValue({ mutate: jest.fn(), isPending: false })
  mockNearby.mockResolvedValue({ data: [], total: 0 })
  mockNearbyHeritage.mockResolvedValue({ data: [], total: 0 })
})

describe("hotel detail page", () => {
  it("shows a skeleton while the hotel details are loading", () => {
    mockHotel.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    const { container } = render(<HotelDetailPage />)

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    )
    expect(
      screen.queryByRole("heading", { level: 1, name: "Sheraton Addis" }),
    ).not.toBeInTheDocument()
  })

  it("shows an error view with retry and a way back to search", async () => {
    const user = userEvent.setup()
    mockHotel.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Hotel service unavailable"),
    })

    render(<HotelDetailPage />)

    const alert = await screen.findByRole("alert")
    expect(
      within(alert).getByRole("heading", {
        name: "Unable to load property details",
      }),
    ).toBeInTheDocument()
    expect(
      within(alert).getByText("Hotel service unavailable"),
    ).toBeInTheDocument()

    await user.click(within(alert).getByRole("button", { name: "Try Again" }))
    expect(mockRefresh).toHaveBeenCalled()

    expect(
      screen.getByRole("link", { name: /Back to Search/ }),
    ).toHaveAttribute("href", "/search")
  })

  it("renders the property header, rating badges, and address", async () => {
    render(<HotelDetailPage />)

    expect(
      await screen.findByRole("heading", { level: 1, name: "Sheraton Addis" }),
    ).toBeInTheDocument()
    expect(screen.getByText("5 Star Luxury")).toBeInTheDocument()
    expect(screen.getByText("Excellent (128 reviews)")).toBeInTheDocument()
    expect(
      screen.getByText("12 Bole Road, Addis Ababa, Ethiopia"),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Back to Search Results/ }),
    ).toHaveAttribute("href", "/search")
    expect(
      screen.getByRole("button", { name: "Save to wishlist" }),
    ).toBeInTheDocument()
    expect(screen.getByAltText("View 1")).toBeInTheDocument()
  })

  it("lists suites with availability, pricing, and booking links for the selected dates", async () => {
    render(<HotelDetailPage />)

    expect(await screen.findByText("Select Your Suite")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Showing availability for 4 nights (2026-06-10 to 2026-06-14)",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("1 Suites Available")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 4, name: "Suite 101" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Deluxe Suite — Executive Floor"),
    ).toBeInTheDocument()
    expect(screen.getByText("Available")).toBeInTheDocument()
    expect(screen.getByText("Unavailable")).toBeInTheDocument()
    expect(
      screen.getAllByRole("link", { name: /Reserve Suite/ })[0],
    ).toHaveAttribute(
      "href",
      "/booking/h1?room=r1&checkIn=2026-06-10&checkOut=2026-06-14&guests=3",
    )
    expect(
      screen.getAllByRole("button", { name: "Reserve Suite" })[1],
    ).toBeDisabled()
    expect(
      screen.getByRole("button", { name: "Available Suites (2)" }),
    ).toBeInTheDocument()
  })

  it("shows the transparent nightly calculation for the stay window", async () => {
    render(<HotelDetailPage />)

    expect(await screen.findByText("ETB 1,500 × 4 nights")).toBeInTheDocument()
    expect(screen.getByText("ETB 6,000")).toBeInTheDocument()
    expect(screen.getByText("Taxes & service fees")).toBeInTheDocument()
    expect(screen.getByText("Calculated at checkout")).toBeInTheDocument()
    expect(screen.getAllByText("/ night").length).toBeGreaterThan(0)
  })

  it("recalculates nights and totals when the check-out date changes", async () => {
    render(<HotelDetailPage />)

    fireEvent.change(screen.getByDisplayValue("2026-06-14"), {
      target: { value: "2026-06-11" },
    })

    expect(
      screen.getByText(
        "Showing availability for 1 night (2026-06-10 to 2026-06-11)",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("ETB 1,500 × 1 night")).toBeInTheDocument()
    expect(screen.getAllByText("ETB 1,500").length).toBeGreaterThan(0)
    expect(mockRooms).toHaveBeenCalledWith("h1", {
      startDate: "2026-06-10",
      endDate: "2026-06-11",
    })
  })

  it("keeps the nights text singular for a one night stay", async () => {
    mockSearch = "checkIn=2026-06-10&checkOut=2026-06-10&guests=2"
    render(<HotelDetailPage />)

    expect(
      await screen.findByText(
        "Showing availability for 1 night (2026-06-10 to 2026-06-10)",
      ),
    ).toBeInTheDocument()
  })

  it("propagates guest selector changes into the reservation links", async () => {
    const user = userEvent.setup()
    render(<HotelDetailPage />)
    await screen.findByText("Select Your Suite")

    await user.click(screen.getByRole("button", { name: "3 Adults" }))
    const dialog = screen.getByRole("dialog", {
      name: "Select number of guests",
    })
    await user.click(
      within(dialog).getByRole("button", { name: "Increase adults" }),
    )
    await user.click(within(dialog).getByRole("button", { name: "Done" }))

    expect(screen.getByRole("button", { name: "4 Adults" })).toBeInTheDocument()
    expect(
      screen.getAllByRole("link", { name: /Reserve Suite/ })[0],
    ).toHaveAttribute(
      "href",
      "/booking/h1?room=r1&checkIn=2026-06-10&checkOut=2026-06-14&guests=4",
    )
  })

  it("switches to the amenities tab and lists hotel amenities", async () => {
    const user = userEvent.setup()
    render(<HotelDetailPage />)
    await screen.findByText("Select Your Suite")

    await user.click(screen.getByRole("button", { name: "Amenities" }))

    expect(
      screen.getByRole("heading", { name: "Property Amenities & Services" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Free Wi-Fi")).toBeInTheDocument()
    expect(screen.getByText("Infinity Pool")).toBeInTheDocument()
    expect(screen.queryByText("Select Your Suite")).not.toBeInTheDocument()
  })

  it("switches to the policies tab and shows policy windows and description", async () => {
    const user = userEvent.setup()
    render(<HotelDetailPage />)
    await screen.findByText("Select Your Suite")

    await user.click(screen.getByRole("button", { name: "Hotel Policies" }))

    expect(
      screen.getByRole("heading", { name: "Hotel Policies & Guest Rules" }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Check-in from:/)).toBeInTheDocument()
    expect(screen.getByText("15:00")).toBeInTheDocument()
    expect(screen.getByText("10:00")).toBeInTheDocument()
    expect(screen.getByText(/Free cancellation up to/)).toBeInTheDocument()
    expect(screen.getByText("2 days")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "About This Property" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("A palatial retreat in the heart of Bole."),
    ).toBeInTheDocument()
  })

  it("switches to the reviews tab and shows a guest review with the hotel response", async () => {
    const user = userEvent.setup()
    render(<HotelDetailPage />)
    await screen.findByText("Select Your Suite")

    await user.click(screen.getByRole("button", { name: "Guest Reviews (1)" }))

    expect(
      screen.getByRole("heading", { name: "Verified Guest Reviews" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Ratings and feedback from verified stays"),
    ).toBeInTheDocument()
    expect(screen.getByText("Selamawit Bekele")).toBeInTheDocument()
    expect(
      screen.getByText("Impeccable service from arrival to departure."),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Response from Hotel Management"),
    ).toBeInTheDocument()
    expect(screen.getByText("(Marta Girma)")).toBeInTheDocument()
    expect(screen.getByText("out of 5.0")).toBeInTheDocument()
  })

  it("shows an empty state when the hotel has no reviews yet", async () => {
    const user = userEvent.setup()
    mockReviews.mockReturnValue({ data: { data: [], total: 0 } })
    render(<HotelDetailPage />)
    await screen.findByText("Select Your Suite")

    await user.click(screen.getByRole("button", { name: "Guest Reviews (0)" }))

    expect(
      screen.getByRole("heading", { name: "No reviews published yet" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Be the first guest to complete a stay and share your experience.",
      ),
    ).toBeInTheDocument()
  })

  it("shows an empty suites state when no rooms are returned", async () => {
    mockRooms.mockReturnValue({ data: [], isLoading: false })

    render(<HotelDetailPage />)

    expect(
      await screen.findByText("No suites available for these dates"),
    ).toBeInTheDocument()
    expect(screen.getByText("0 Suites Available")).toBeInTheDocument()
    expect(screen.getByText("—")).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: /Reserve Suite/ }),
    ).not.toBeInTheDocument()
  })
})
