import { act, render, screen, waitFor, within } from "@testing-library/react"
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
import { discoverApi, tripApi } from "@/lib/services"
import { apiClient } from "@/lib/axios"
import type { PlaceItem, Trip } from "@/lib/services"

let mockSearch = "checkIn=2026-06-10&checkOut=2026-06-14&guests=2"
const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
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
const mockTrips = tripApi.list as jest.Mock
const mockAddItem = tripApi.addItem as jest.Mock
const mockPost = jest.spyOn(apiClient, "post")

const HOTEL = {
  id: "h1",
  name: "Sheraton Addis",
  description: "A palatial retreat in the heart of Bole.",
  address: "12 Bole Road",
  city: { id: "addis", name: "Addis Ababa", country: { name: "Ethiopia" } },
  starRating: 5,
  averageRating: 4.8,
  reviewCount: 128,
  amenities: ["Free Wi-Fi"],
  images: [
    { id: "i1", url: "https://images.example/one.jpg", isPrimary: true },
  ],
  lat: 9.01,
  lng: 38.74,
}

const ROOM = {
  id: "r1",
  roomNumber: "101",
  type: "Deluxe",
  capacity: 2,
  beds: 2,
  bathroom: 1,
  basePrice: 1500,
  status: "AVAILABLE",
  amenities: [],
  availableAcrossRange: true,
}

const PLACE: PlaceItem = {
  id: "p1",
  name: "Tomoca Coffee",
  description: "Historic espresso bar.",
  category: "CAFE",
  status: "ACTIVE",
  address: "Wanzéte Yilma St, Addis Ababa",
  lat: 9.01,
  lng: 38.75,
  cityId: "addis",
  hoursVerified: true,
  images: [],
  lastVerifiedAt: "2026-01-15T00:00:00.000Z",
  source: { id: "s1", name: "Addis Guide", license: "CC BY 4.0" },
  distanceKm: 0.6,
}

const MUSEUM_PLACE: PlaceItem = {
  ...PLACE,
  id: "p2",
  name: "Ethnological Museum",
  category: "MUSEUM",
  distanceKm: 2.4,
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
  mockSearch = "checkIn=2026-06-10&checkOut=2026-06-14&guests=2"
  mockHotel.mockReturnValue({ data: HOTEL, isLoading: false, isError: false })
  mockRooms.mockReturnValue({ data: [ROOM], isLoading: false })
  mockPolicy.mockReturnValue({ data: undefined })
  mockReviews.mockReturnValue({ data: { data: [], total: 0 } })
  mockFavorites.mockReturnValue({ data: [] })
  mockToggle.mockReturnValue({ mutate: jest.fn(), isPending: false })
  mockNearby.mockResolvedValue({ data: [PLACE, MUSEUM_PLACE], total: 2 })
  mockNearbyHeritage.mockResolvedValue({ data: [], total: 0 })
  mockTrips.mockResolvedValue({ data: [TRIP], total: 1 })
  mockAddItem.mockResolvedValue({
    item: {},
    hasConflict: false,
    conflictWith: [],
  })
  mockPost.mockResolvedValue({ data: {} })
})

describe("hotel wishlist and contact actions", () => {
  it("asks signed-out visitors to sign in before saving a favorite", async () => {
    const user = userEvent.setup()
    const mutate = jest.fn()
    mockToggle.mockReturnValue({ mutate, isPending: false })

    render(<HotelDetailPage />)
    await user.click(screen.getByRole("button", { name: "Save to wishlist" }))

    expect(mutate).not.toHaveBeenCalled()
    expect(useToastStore.getState().toasts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "info",
          title: "Sign in required",
          message: "Please sign in to add hotels to your wishlist.",
        }),
      ]),
    )
  })

  it("toggles the favorite mutation for a signed-in guest", async () => {
    const user = userEvent.setup()
    const mutate = jest.fn()
    mockToggle.mockReturnValue({ mutate, isPending: false })
    useAuth
      .getState()
      .setSession({ user: CUSTOMER, accessToken: "a", refreshToken: "r" })

    render(<HotelDetailPage />)
    await user.click(screen.getByRole("button", { name: "Save to wishlist" }))

    expect(mutate).toHaveBeenCalledWith({ hotelId: "h1", isFavorite: false })
    expect(useToastStore.getState().toasts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "success",
          title: "Saved to favorites",
        }),
      ]),
    )
  })

  it("marks an existing favorite and removes it on click", async () => {
    const user = userEvent.setup()
    const mutate = jest.fn()
    mockToggle.mockReturnValue({ mutate, isPending: false })
    mockFavorites.mockReturnValue({ data: [{ id: "h1" }] })
    useAuth
      .getState()
      .setSession({ user: CUSTOMER, accessToken: "a", refreshToken: "r" })

    render(<HotelDetailPage />)

    const button = await screen.findByRole("button", {
      name: "Remove from wishlist",
    })
    expect(button).toHaveTextContent("Saved")
    await user.click(button)

    expect(mutate).toHaveBeenCalledWith({ hotelId: "h1", isFavorite: true })
    expect(useToastStore.getState().toasts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "success",
          title: "Removed from favorites",
        }),
      ]),
    )
  })

  it("requires sign in before sending a concierge message", async () => {
    const user = userEvent.setup()

    render(<HotelDetailPage />)
    await user.click(
      screen.getByRole("button", { name: "Contact Hotel Concierge" }),
    )

    const dialog = screen.getByRole("dialog")
    expect(
      within(dialog).getByRole("heading", { name: "Contact Front Desk" }),
    ).toBeInTheDocument()

    await user.type(
      within(dialog).getByPlaceholderText(
        "e.g. Airport Transfer, Early Arrival",
      ),
      "Early check-in",
    )
    await user.type(
      within(dialog).getByPlaceholderText(
        "Please state any special inquiries or requests...",
      ),
      "Arriving at 06:00.",
    )
    await user.click(
      within(dialog).getByRole("button", { name: /Send Message/ }),
    )

    expect(mockPost).not.toHaveBeenCalled()
    expect(useToastStore.getState().toasts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "info",
          title: "Sign in required",
          message: "Please sign in to contact the front desk.",
        }),
      ]),
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("sends the concierge message and closes the modal", async () => {
    const user = userEvent.setup()
    useAuth
      .getState()
      .setSession({ user: CUSTOMER, accessToken: "a", refreshToken: "r" })

    render(<HotelDetailPage />)
    await user.click(
      screen.getByRole("button", { name: "Contact Hotel Concierge" }),
    )

    const dialog = screen.getByRole("dialog")
    await user.type(
      within(dialog).getByPlaceholderText(
        "e.g. Airport Transfer, Early Arrival",
      ),
      "  Late arrival  ",
    )
    await user.type(
      within(dialog).getByPlaceholderText(
        "Please state any special inquiries or requests...",
      ),
      "Please hold the suite.",
    )
    await user.click(
      within(dialog).getByRole("button", { name: /Send Message/ }),
    )

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/hotels/h1/contact", {
        subject: "Late arrival",
        message: "Please hold the suite.",
      }),
    )
    expect(useToastStore.getState().toasts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "success", title: "Message sent" }),
      ]),
    )
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    )
  })

  it("keeps the modal open and reports the failure when sending fails", async () => {
    const user = userEvent.setup()
    mockPost.mockRejectedValue(new Error("Mailbox unavailable"))
    useAuth
      .getState()
      .setSession({ user: CUSTOMER, accessToken: "a", refreshToken: "r" })

    render(<HotelDetailPage />)
    await user.click(
      screen.getByRole("button", { name: "Contact Hotel Concierge" }),
    )

    const dialog = screen.getByRole("dialog")
    await user.type(
      within(dialog).getByPlaceholderText(
        "e.g. Airport Transfer, Early Arrival",
      ),
      "Help",
    )
    await user.type(
      within(dialog).getByPlaceholderText(
        "Please state any special inquiries or requests...",
      ),
      "Need assistance.",
    )
    await user.click(
      within(dialog).getByRole("button", { name: /Send Message/ }),
    )

    await waitFor(() =>
      expect(useToastStore.getState().toasts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "error",
            title: "Unable to send message",
            message: "Mailbox unavailable",
          }),
        ]),
      ),
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})

describe("hotel nearby culture places", () => {
  it("renders nearby places with distance labels and navigation links", async () => {
    render(<HotelDetailPage />)

    expect(
      await screen.findByRole("heading", { name: "Tomoca Coffee" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Explore near Sheraton Addis" }),
    ).toBeInTheDocument()
    expect(mockNearby).toHaveBeenCalledWith({
      lat: 9.01,
      lng: 38.74,
      radiusKm: 10,
      limit: 30,
    })
    expect(mockNearbyHeritage).toHaveBeenCalledWith("h1", {
      radiusKm: 15,
      limit: 30,
    })
    expect(
      screen.getByRole("heading", { name: "Tomoca Coffee" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Ethnological Museum" }),
    ).toBeInTheDocument()
    expect(screen.getByText("600m from hotel")).toBeInTheDocument()
    expect(screen.getByText("2.4 km from hotel")).toBeInTheDocument()
    expect(screen.getAllByRole("link", { name: /Navigate to/ })).toHaveLength(2)
    expect(
      screen.getByRole("link", { name: /View all Discover places/ }),
    ).toHaveAttribute("href", "/discover")
    expect(
      screen.getByRole("link", { name: /History & Heritage/ }),
    ).toHaveAttribute("href", "/discover/heritage/addis")
  })

  it("filters nearby places by category", async () => {
    const user = userEvent.setup()
    render(<HotelDetailPage />)
    await screen.findByRole("heading", { name: "Tomoca Coffee" })

    const museums = screen.getByRole("button", { name: "Museums" })
    expect(museums).toHaveAttribute("aria-pressed", "false")
    await user.click(museums)

    expect(museums).toHaveAttribute("aria-pressed", "true")
    expect(
      screen.getByRole("heading", { name: "Ethnological Museum" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Tomoca Coffee" }),
    ).not.toBeInTheDocument()
  })

  it("hides the neighborhood section when the active category has no places", async () => {
    mockNearby.mockResolvedValue({ data: [PLACE], total: 1 })
    const user = userEvent.setup()
    render(<HotelDetailPage />)
    await screen.findByRole("heading", { name: "Tomoca Coffee" })

    await user.click(screen.getByRole("button", { name: "Heritage" }))

    // Defect: the section wrapper only renders when culturePlaces.length > 0, so
    // the built-in "No verified places in this category yet." empty state never appears.
    expect(
      screen.queryByRole("heading", { name: "Tomoca Coffee" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText("No verified places in this category yet."),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Explore near Sheraton Addis" }),
    ).not.toBeInTheDocument()
  })

  it("shows an error panel and retries the nearby lookup", async () => {
    mockNearby.mockRejectedValueOnce(new Error("Directory unavailable"))
    const user = userEvent.setup()
    render(<HotelDetailPage />)

    expect(await screen.findByText("Directory unavailable")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(
      await screen.findByRole("heading", { name: "Tomoca Coffee" }),
    ).toBeInTheDocument()
    expect(mockNearby.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it("requires sign in before saving a place to a trip", async () => {
    const user = userEvent.setup()
    render(<HotelDetailPage />)
    await screen.findByRole("heading", { name: "Tomoca Coffee" })

    await user.click(
      screen.getAllByRole("button", { name: "Save to My Trip" })[0],
    )

    expect(mockTrips).not.toHaveBeenCalled()
    expect(useToastStore.getState().toasts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "info",
          title: "Sign in required",
          message: "Please sign in to save places to your trip.",
        }),
      ]),
    )
  })

  it("saves a place onto the first trip using the selected check-in day", async () => {
    const user = userEvent.setup()
    useAuth
      .getState()
      .setSession({ user: CUSTOMER, accessToken: "a", refreshToken: "r" })
    render(<HotelDetailPage />)
    await screen.findByRole("heading", { name: "Tomoca Coffee" })

    await user.click(
      screen.getAllByRole("button", { name: "Save to My Trip" })[0],
    )

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

  it("falls back to the trip start date when check-in is outside the trip", async () => {
    const user = userEvent.setup()
    mockSearch = "checkIn=2026-07-20&checkOut=2026-07-22&guests=2"
    useAuth
      .getState()
      .setSession({ user: CUSTOMER, accessToken: "a", refreshToken: "r" })
    render(<HotelDetailPage />)
    await screen.findByRole("heading", { name: "Tomoca Coffee" })

    await user.click(
      screen.getAllByRole("button", { name: "Save to My Trip" })[0],
    )

    await waitFor(() =>
      expect(mockAddItem).toHaveBeenCalledWith(
        "trip-1",
        expect.objectContaining({ dayDate: "2026-06-01" }),
      ),
    )
  })

  it("offers trip creation when the guest has no itineraries", async () => {
    const user = userEvent.setup()
    mockTrips.mockResolvedValue({ data: [], total: 0 })
    useAuth
      .getState()
      .setSession({ user: CUSTOMER, accessToken: "a", refreshToken: "r" })
    render(<HotelDetailPage />)
    await screen.findByRole("heading", { name: "Tomoca Coffee" })

    await user.click(
      screen.getAllByRole("button", { name: "Save to My Trip" })[0],
    )

    await waitFor(() =>
      expect(useToastStore.getState().toasts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "info",
            title: "Create a trip first",
            message:
              "Open My Trips to create an itinerary, then save this place.",
          }),
        ]),
      ),
    )
    expect(mockAddItem).not.toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith("/trips")
  })

  it("reports a timing conflict when the itinerary rejects the slot", async () => {
    const user = userEvent.setup()
    mockAddItem.mockResolvedValue({
      item: {},
      hasConflict: true,
      conflictWith: [],
    })
    useAuth
      .getState()
      .setSession({ user: CUSTOMER, accessToken: "a", refreshToken: "r" })
    render(<HotelDetailPage />)
    await screen.findByRole("heading", { name: "Tomoca Coffee" })

    await user.click(
      screen.getAllByRole("button", { name: "Save to My Trip" })[0],
    )

    await waitFor(() =>
      expect(useToastStore.getState().toasts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "success",
            title: "Saved with a timing conflict",
            message:
              "Review the itinerary conflict before confirming your day.",
          }),
        ]),
      ),
    )
    await act(async () => undefined)
    expect(
      screen.getAllByRole("button", { name: "Save to My Trip" })[0],
    ).toBeEnabled()
  })
})
