import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DiscoverPlacePage from "@/app/discover/[placeId]/page"
import { discoverApi, tripApi } from "@/lib/services"
import { useAuth } from "@/lib/auth-store"
import { useToastStore } from "@/components/ui/Toast"
import type { PlaceItem, Trip } from "@/lib/services"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/discover/p1",
  useParams: () => ({ placeId: "p1" }),
  useSearchParams: () => new URLSearchParams(""),
}))

jest.mock("@/lib/services", () => ({
  discoverApi: { place: jest.fn(), nearbyHotels: jest.fn() },
  tripApi: { list: jest.fn(), addItem: jest.fn() },
}))

const mockPlace = discoverApi.place as jest.Mock
const mockNearby = discoverApi.nearbyHotels as jest.Mock
const mockTrips = tripApi.list as jest.Mock
const mockAddItem = tripApi.addItem as jest.Mock

const PLACE: PlaceItem = {
  id: "p1",
  name: "National Museum of Ethiopia",
  description: "Home of the famous Lucy fossils.",
  category: "MUSEUM",
  status: "ACTIVE",
  address: "King George VI St, Addis Ababa",
  lat: 9.03,
  lng: 38.76,
  cityId: "addis",
  phone: "+251 11 118 4703",
  openingHours: "09:00 - 17:00",
  hoursVerified: true,
  priceLevel: 2,
  rating: 4.6,
  images: [],
  lastVerifiedAt: "2026-01-15T00:00:00.000Z",
  source: {
    id: "s1",
    name: "Ethiopian Heritage Authority",
    license: "CC BY 4.0",
  },
  distanceKm: 1.2,
}

const TRIP: Trip = {
  id: "trip-1",
  title: "Addis Weekend",
  startDate: "2026-02-01T00:00:00.000Z",
  endDate: "2026-02-04T00:00:00.000Z",
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
  mockPlace.mockResolvedValue(PLACE)
  mockNearby.mockResolvedValue({ data: [], total: 0 })
  mockTrips.mockResolvedValue({ data: [], total: 0 })
  mockAddItem.mockResolvedValue({ data: {}, conflicts: [] })
})

describe("discover place page", () => {
  it("shows a skeleton while the place is loading", async () => {
    let resolvePlace: (value: PlaceItem) => void = () => undefined
    mockPlace.mockReturnValue(
      new Promise<PlaceItem>((resolve) => (resolvePlace = resolve)),
    )

    const { container } = render(<DiscoverPlacePage />)

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    )
    expect(
      screen.queryByRole("heading", {
        level: 1,
        name: "National Museum of Ethiopia",
      }),
    ).not.toBeInTheDocument()

    await act(async () => {
      resolvePlace(PLACE)
    })
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "National Museum of Ethiopia",
      }),
    ).toBeInTheDocument()
  })

  it("renders the place details, highlights, and visiting information", async () => {
    mockNearby.mockResolvedValue({
      data: [
        {
          id: "h9",
          name: "Sheraton Addis",
          address: "Bole Rd",
          starRating: 5,
          images: [],
          distanceKm: 0.4,
        },
      ],
      total: 1,
    })
    render(<DiscoverPlacePage />)

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "National Museum of Ethiopia",
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByText("Museum").length).toBeGreaterThan(0)
    expect(
      screen.getByText("Home of the famous Lucy fossils."),
    ).toBeInTheDocument()
    expect(screen.getByText("Verified operating hours")).toBeInTheDocument()
    expect(screen.getByText("Price: $$")).toBeInTheDocument()
    expect(screen.getByText("4.6")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "About this Landmark" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Why It Matters" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "What You Can See" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Permanent historical exhibitions and curated artefacts",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Visiting Information" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("King George VI St, Addis Ababa"),
    ).toBeInTheDocument()
    expect(screen.getByText("09:00 - 17:00")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Sheraton Addis/ }),
    ).toHaveAttribute("href", "/hotel/h9")
    expect(screen.getByText("400 m")).toBeInTheDocument()
  })

  it("shows an empty message when no nearby hotels are returned", async () => {
    render(<DiscoverPlacePage />)

    expect(
      await screen.findByRole("heading", { name: "Hotels near this place" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "No active hotels were found within the verified search radius.",
      ),
    ).toBeInTheDocument()
  })

  it("shows an error view when the place cannot be loaded", async () => {
    mockPlace.mockRejectedValue(new Error("This place could not be loaded."))
    render(<DiscoverPlacePage />)

    expect(
      await screen.findByText("This place could not be loaded."),
    ).toBeInTheDocument()
    const back = screen.getByRole("button", { name: "Back to Discover" })
    await userEvent.click(back)
    expect(mockPush).toHaveBeenCalledWith("/discover")
  })

  it("toggles the local favorite and persists it", async () => {
    const user = userEvent.setup()
    render(<DiscoverPlacePage />)
    await screen.findByRole("heading", {
      level: 1,
      name: "National Museum of Ethiopia",
    })

    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(
      JSON.parse(localStorage.getItem("luxstay_place_favorites") || "[]"),
    ).toEqual(["p1"])
    expect(useToastStore.getState().toasts).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: "Saved" })]),
    )

    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(
      JSON.parse(localStorage.getItem("luxstay_place_favorites") || "[]"),
    ).toEqual([])
    expect(useToastStore.getState().toasts).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: "Save" })]),
    )
  })

  it("sends signed-out visitors to sign in instead of opening the modal", async () => {
    const user = userEvent.setup()
    render(<DiscoverPlacePage />)
    await screen.findByRole("heading", {
      level: 1,
      name: "National Museum of Ethiopia",
    })

    await user.click(screen.getByRole("button", { name: "Add to Itinerary" }))

    expect(mockPush).toHaveBeenCalledWith("/auth")
    expect(screen.queryByText("Schedule Landmark")).not.toBeInTheDocument()
    expect(useToastStore.getState().toasts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "info",
          title: "Sign in required",
          message: "Please sign in to schedule places on your itinerary.",
        }),
      ]),
    )
    expect(mockTrips).not.toHaveBeenCalled()
  })

  it("schedules the place on the first trip by default", async () => {
    const user = userEvent.setup()
    mockTrips.mockResolvedValue({ data: [TRIP], total: 1 })
    useAuth
      .getState()
      .setSession({ user: CUSTOMER, accessToken: "a", refreshToken: "r" })
    render(<DiscoverPlacePage />)
    await screen.findByRole("heading", {
      level: 1,
      name: "National Museum of Ethiopia",
    })

    await user.click(screen.getByRole("button", { name: "Add to Itinerary" }))

    await screen.findByText("Schedule Landmark")
    const dialog = screen
      .getByText("Selected Place")
      .closest("form") as HTMLElement
    expect(
      within(dialog).getByText("National Museum of Ethiopia"),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByRole("option", {
        name: "Addis Weekend (2026-02-01 to 2026-02-04)",
      }),
    ).toBeInTheDocument()
    expect(within(dialog).getByDisplayValue("2026-02-01")).toBeInTheDocument()
    expect(within(dialog).getByDisplayValue("10:00")).toBeInTheDocument()
    expect(
      within(dialog).getByDisplayValue("Explore National Museum of Ethiopia"),
    ).toBeInTheDocument()

    await user.click(
      within(dialog).getByRole("button", { name: "Confirm & Add" }),
    )

    await waitFor(() =>
      expect(mockAddItem).toHaveBeenCalledWith("trip-1", {
        placeId: "p1",
        title: "Visit National Museum of Ethiopia",
        dayDate: "2026-02-01",
        startTime: "10:00",
        durationMin: 90,
        notes: "Explore National Museum of Ethiopia",
        itemType: "PLACE",
        currency: "ETB",
      }),
    )
    expect(useToastStore.getState().toasts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Added to Itinerary!",
          message: "National Museum of Ethiopia is now scheduled on your trip.",
        }),
      ]),
    )
    await waitFor(() =>
      expect(screen.queryByText("Schedule Landmark")).not.toBeInTheDocument(),
    )
  })

  it("offers trip creation when the guest has no itineraries", async () => {
    const user = userEvent.setup()
    useAuth
      .getState()
      .setSession({ user: CUSTOMER, accessToken: "a", refreshToken: "r" })
    render(<DiscoverPlacePage />)
    await screen.findByRole("heading", {
      level: 1,
      name: "National Museum of Ethiopia",
    })

    await user.click(screen.getByRole("button", { name: "Add to Itinerary" }))

    expect(
      await screen.findByText("You don't have an itinerary created yet."),
    ).toBeInTheDocument()
    const create = screen.getByRole("link", { name: "Create a Trip First" })
    expect(create).toHaveAttribute("href", "/trips")
    expect(
      screen.queryByRole("button", { name: "Confirm & Add" }),
    ).not.toBeInTheDocument()
  })

  it("keeps the modal open and reports the failure when scheduling fails", async () => {
    const user = userEvent.setup()
    mockTrips.mockResolvedValue({ data: [TRIP], total: 1 })
    mockAddItem.mockRejectedValue(new Error("Please check your trip dates."))
    useAuth
      .getState()
      .setSession({ user: CUSTOMER, accessToken: "a", refreshToken: "r" })
    render(<DiscoverPlacePage />)
    await screen.findByRole("heading", {
      level: 1,
      name: "National Museum of Ethiopia",
    })

    await user.click(screen.getByRole("button", { name: "Add to Itinerary" }))
    await user.click(
      await screen.findByRole("button", { name: "Confirm & Add" }),
    )

    await waitFor(() =>
      expect(useToastStore.getState().toasts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "error",
            title: "Failed to add place",
            message: "Please check your trip dates.",
          }),
        ]),
      ),
    )
    expect(screen.getByText("Schedule Landmark")).toBeInTheDocument()
  })
})
