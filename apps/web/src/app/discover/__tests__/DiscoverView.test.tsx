import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DiscoverView from "@/app/discover/DiscoverView"
import { discoverApi, tripApi } from "@/lib/services"
import type { DestinationItem, PlaceItem, Trip } from "@/lib/services"
import { useAuth } from "@/lib/auth-store"
import { useToastStore } from "@/components/ui/Toast"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/discover",
  useParams: () => ({ id: "1" }),
  useSearchParams: () => new URLSearchParams(""),
}))

jest.mock("@/lib/services", () => ({
  discoverApi: {
    destinations: jest.fn(),
    nearby: jest.fn(),
    emergency: jest.fn(),
    search: jest.fn(),
  },
  tripApi: {
    list: jest.fn(),
    addItem: jest.fn(),
  },
  transportationApi: {
    services: jest.fn(),
    myBookings: jest.fn(),
    createBooking: jest.fn(),
    cancelBooking: jest.fn(),
  },
}))

jest.mock("@/app/discover/HeritageMap", () => ({
  __esModule: true,
  default: (props: { places: Array<{ name: string }> }) => (
    <div
      data-testid="heritage-map"
      data-place-count={String(props.places.length)}
    />
  ),
}))

const mockedDiscover = discoverApi as jest.Mocked<typeof discoverApi>
const mockedTrip = tripApi as jest.Mocked<typeof tripApi>

function makePlace(overrides: Partial<PlaceItem> = {}): PlaceItem {
  return {
    id: "p1",
    name: "National Museum of Ethiopia",
    description: "Home to Lucy.",
    category: "MUSEUM",
    status: "VERIFIED",
    address: "Arat Kilo, Addis Ababa",
    lat: 9.038,
    lng: 38.763,
    hoursVerified: true,
    rating: 4.7,
    images: [],
    ...overrides,
  }
}

function makeDestination(id: string, name: string): DestinationItem {
  return {
    id,
    name,
    description: `${name} highlights`,
    heroImage: null,
    country: { id: "et", name: "Ethiopia", code: "ET" },
    placeCount: 4,
    hotelCount: 6,
  }
}

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    title: "Historic north",
    startDate: "2026-12-01T00:00:00.000Z",
    endDate: "2026-12-07T00:00:00.000Z",
    timezone: "Africa/Addis_Ababa",
    items: [],
    ...overrides,
  }
}

const NO_PLACES: PlaceItem[] = []
const NO_DESTINATIONS: DestinationItem[] = []

function renderView(
  props: {
    initialPlaces?: PlaceItem[]
    initialDestinations?: DestinationItem[]
  } = {},
) {
  return render(
    <DiscoverView
      initialPlaces={props.initialPlaces ?? NO_PLACES}
      initialDestinations={props.initialDestinations ?? NO_DESTINATIONS}
    />,
  )
}

const guestState = {
  user: null,
  tokens: null,
  loading: false,
  isInitialized: true,
  isAdmin: false,
  isManager: false,
  isStaff: false,
  isCustomer: false,
}

describe("DiscoverView", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = ""
    useAuth.setState({ ...guestState })
    useToastStore.setState({ toasts: [] })
    mockedDiscover.destinations.mockResolvedValue([])
    mockedDiscover.nearby.mockResolvedValue({ center: {}, total: 0, data: [] })
    mockedDiscover.emergency.mockResolvedValue({ total: 0, data: [] })
    mockedDiscover.search.mockResolvedValue({ query: "", total: 0, data: [] })
    mockedTrip.list.mockResolvedValue({ data: [], total: 0 })
    mockedTrip.addItem.mockResolvedValue({
      item: { id: "item-1" } as never,
      hasConflict: false,
      conflictWith: [],
    })
  })

  it("keeps server-provided data and skips the redundant fetches", () => {
    const place = makePlace()
    render(
      <DiscoverView
        initialDestinations={[makeDestination("gondar", "Gondar")]}
        initialPlaces={[place]}
      />,
    )

    expect(screen.getByText("National Museum of Ethiopia")).toBeInTheDocument()
    expect(screen.getByText("Gondar")).toBeInTheDocument()
    expect(
      screen.getByText("1 verified destinations published"),
    ).toBeInTheDocument()
    expect(mockedDiscover.nearby).not.toHaveBeenCalled()
    expect(mockedDiscover.destinations).not.toHaveBeenCalled()
    expect(mockedDiscover.search).not.toHaveBeenCalled()
  })

  it("stays in the loading state until the first nearby fetch resolves", async () => {
    let resolveNearby: (value: {
      center: unknown
      total: number
      data: PlaceItem[]
    }) => void = () => undefined
    mockedDiscover.nearby.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveNearby = resolve
        }) as never,
    )

    const { container } = renderView()

    const explorer = container.ownerDocument.getElementById(
      "discover-explorer",
    ) as HTMLElement
    expect(explorer.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    )
    expect(screen.queryByText("No places found")).not.toBeInTheDocument()
    expect(mockedDiscover.nearby).toHaveBeenCalledWith({
      lat: 9.0105,
      lng: 38.7612,
      radiusKm: 10,
      category: undefined,
      limit: 50,
    })

    resolveNearby({ center: {}, total: 1, data: [makePlace()] })

    expect(
      await screen.findByText("National Museum of Ethiopia"),
    ).toBeInTheDocument()
    expect(explorer.querySelectorAll(".animate-pulse")).toHaveLength(0)
  })

  it("renders place cards with distance and quick actions once loaded", async () => {
    mockedDiscover.nearby.mockResolvedValue({
      center: {},
      total: 1,
      data: [makePlace({ rating: 4.7 })],
    })
    renderView()

    expect(
      await screen.findByText("National Museum of Ethiopia"),
    ).toBeInTheDocument()
    expect(screen.getByText("MUSEUM")).toBeInTheDocument()
    expect(screen.getByText("Arat Kilo, Addis Ababa")).toBeInTheDocument()
    expect(screen.getByText(/\d+\.\d km away/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Details/ })).toHaveAttribute(
      "href",
      "/discover/p1",
    )
    expect(
      screen.getAllByRole("button", { name: "Add to Itinerary" }),
    ).toHaveLength(1)
  })

  it("shows the empty state when the search radius finds nothing", async () => {
    renderView()

    expect(await screen.findByText("No places found")).toBeInTheDocument()
    expect(
      screen.getByText(
        /No verified spots match your current neighborhood filter/,
      ),
    ).toBeInTheDocument()
  })

  it("drives the search endpoint from the hero search box", async () => {
    const user = userEvent.setup()
    mockedDiscover.search.mockResolvedValue({
      query: "lalibela",
      total: 1,
      data: [
        makePlace({ id: "lalibela-1", name: "Rock Churches of Lalibela" }),
      ],
    })
    renderView()

    const input = screen.getByPlaceholderText(
      "Where do you want to go in Ethiopia?",
    )
    await user.type(input, "lalibela")

    expect(mockedDiscover.search).toHaveBeenLastCalledWith({
      q: "lalibela",
      limit: 40,
    })
    expect(
      await screen.findByText("Rock Churches of Lalibela"),
    ).toBeInTheDocument()

    const searchBar = input.parentElement as HTMLElement
    const barButtons = within(searchBar).getAllByRole("button")
    expect(barButtons).toHaveLength(2)

    await user.click(barButtons[0])
    expect(input).toHaveValue("")
    await waitFor(() =>
      expect(mockedDiscover.nearby).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: undefined }),
      ),
    )
  })

  it("filters the category tabs through the nearby endpoint", async () => {
    const user = userEvent.setup()
    renderView()

    await screen.findByText("No places found")

    await user.click(screen.getByRole("button", { name: /Heritage & Museums/ }))
    await waitFor(() =>
      expect(mockedDiscover.nearby).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: "HERITAGE" }),
      ),
    )

    await user.click(screen.getByRole("button", { name: /Dining & Coffee/ }))
    await waitFor(() =>
      expect(mockedDiscover.nearby).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: "RESTAURANT" }),
      ),
    )

    await user.click(
      screen.getByRole("button", { name: /Emergency Directory/ }),
    )
    expect(await screen.findByText("No places found")).toBeInTheDocument()
    expect(mockedDiscover.emergency).toHaveBeenCalledWith({
      city: "Addis Ababa",
    })
  })

  it("renders emergency contacts in the emergency tab", async () => {
    const user = userEvent.setup()
    mockedDiscover.emergency.mockResolvedValue({
      total: 1,
      data: [
        {
          id: "ec1",
          kind: "HOSPITAL",
          name: "Nordic Medical Center",
          phone: "+251 929 105 653",
          city: "Addis Ababa",
          lastVerifiedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    })
    renderView()

    await user.click(
      screen.getByRole("button", { name: /Emergency Directory/ }),
    )

    expect(await screen.findByText("Nordic Medical Center")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /251 929 105 653/ }),
    ).toHaveAttribute("href", "tel:+251 929 105 653")
    expect(
      screen.queryByText("National Museum of Ethiopia"),
    ).not.toBeInTheDocument()
  })

  it("re-centres the search when a neighbourhood chip is picked", async () => {
    const user = userEvent.setup()
    renderView()

    await screen.findByText("No places found")

    await user.click(screen.getByRole("button", { name: "Bole" }))

    await waitFor(() =>
      expect(mockedDiscover.nearby).toHaveBeenLastCalledWith(
        expect.objectContaining({ lat: 8.995, lng: 38.788 }),
      ),
    )
    expect(screen.getByRole("button", { name: "Bole" }).className).toContain(
      "bg-[#0b1528]",
    )
  })

  it("applies the radius slider to the search", async () => {
    renderView()

    await screen.findByText("No places found")

    fireEvent.change(
      screen.getByLabelText("Nearby search radius in kilometres"),
      {
        target: { value: "4" },
      },
    )

    expect(screen.getByText("Radius 4 km")).toBeInTheDocument()
    await waitFor(() =>
      expect(mockedDiscover.nearby).toHaveBeenLastCalledWith(
        expect.objectContaining({ radiusKm: 4 }),
      ),
    )
  })

  it("uses the device location when permission is granted", async () => {
    const user = userEvent.setup()
    const getCurrentPosition = jest.fn((success: PositionCallback) =>
      success({
        coords: { latitude: 9.03, longitude: 38.74 },
      } as GeolocationPosition),
    )
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    })

    renderView()

    await user.click(screen.getByRole("button", { name: "Use my location" }))

    expect(getCurrentPosition).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByRole("button", { name: "Using my location" }),
    ).toBeInTheDocument()
    expect(useToastStore.getState().toasts[0]).toMatchObject({
      title: "Location enabled",
    })
    await waitFor(() =>
      expect(mockedDiscover.nearby).toHaveBeenLastCalledWith(
        expect.objectContaining({ lat: 9.03, lng: 38.74 }),
      ),
    )
  })

  it("filters the destination showcase by category", async () => {
    const user = userEvent.setup()
    render(
      <DiscoverView
        initialDestinations={[
          makeDestination("gondar", "Gondar"),
          makeDestination("lalibela", "Lalibela"),
          makeDestination("bahir-dar", "Bahir Dar"),
        ]}
        initialPlaces={[makePlace()]}
      />,
    )

    const showcase = screen.getByRole("region", {
      name: /Choose your Ethiopia/,
    })
    expect(within(showcase).getAllByRole("article")).toHaveLength(3)
    expect(
      screen.getByRole("region", { name: /Explore nearby landmarks/ }),
    ).toBeInTheDocument()

    await user.click(within(showcase).getByRole("button", { name: "Heritage" }))

    expect(within(showcase).getByText("Gondar")).toBeInTheDocument()
    expect(within(showcase).getByText("Lalibela")).toBeInTheDocument()
    expect(within(showcase).queryByText("Bahir Dar")).not.toBeInTheDocument()

    await user.click(within(showcase).getByRole("button", { name: "For you" }))
    expect(within(showcase).getByText("Bahir Dar")).toBeInTheDocument()
  })

  it("toggles the wishlist badge on a destination card", async () => {
    const user = userEvent.setup()
    render(
      <DiscoverView
        initialDestinations={[makeDestination("gondar", "Gondar")]}
        initialPlaces={[makePlace()]}
      />,
    )

    const card = screen.getByText("Gondar").closest("article") as HTMLElement
    const heart = within(card).getByRole("button")

    expect(screen.queryByText("1")).not.toBeInTheDocument()

    await user.click(heart)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(useToastStore.getState().toasts[0]).toMatchObject({ title: "Saved" })

    await user.click(heart)
    expect(screen.queryByText("1")).not.toBeInTheDocument()
    expect(useToastStore.getState().toasts[1]).toMatchObject({ title: "Save" })
  })

  it("asks a guest to sign in before adding a place to an itinerary", async () => {
    const user = userEvent.setup()
    mockedDiscover.nearby.mockResolvedValue({
      center: {},
      total: 1,
      data: [makePlace()],
    })
    renderView()

    await user.click(
      await screen.findByRole("button", { name: "Add to Itinerary" }),
    )

    expect(useToastStore.getState().toasts[0]).toMatchObject({
      title: "Sign in required",
    })
    expect(screen.queryByText("Add to Your Itinerary")).not.toBeInTheDocument()
    expect(mockedTrip.list).not.toHaveBeenCalled()
  })

  it("guides a signed-in traveller to create a first trip", async () => {
    const user = userEvent.setup()
    useAuth.setState({
      ...guestState,
      user: {
        id: "u1",
        email: "guest@example.com",
        fullName: "Guest User",
        role: "CUSTOMER",
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      isCustomer: true,
    })
    mockedDiscover.nearby.mockResolvedValue({
      center: {},
      total: 1,
      data: [makePlace()],
    })
    mockedTrip.list.mockResolvedValue({ data: [], total: 0 })
    renderView()

    await user.click(
      await screen.findByRole("button", { name: "Add to Itinerary" }),
    )

    expect(await screen.findByText("Add to Your Itinerary")).toBeInTheDocument()
    expect(mockedTrip.list).toHaveBeenCalledTimes(1)
    expect(
      screen.getByText("You don't have any active itineraries yet."),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Create a Trip First/ }),
    ).toHaveAttribute("href", "/trips")
    expect(
      screen.queryByRole("button", { name: "Confirm & Add to Schedule" }),
    ).not.toBeInTheDocument()
  })

  it("adds the place to a chosen trip", async () => {
    const user = userEvent.setup()
    useAuth.setState({
      ...guestState,
      user: {
        id: "u1",
        email: "guest@example.com",
        fullName: "Guest User",
        role: "CUSTOMER",
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      isCustomer: true,
    })
    mockedDiscover.nearby.mockResolvedValue({
      center: {},
      total: 1,
      data: [makePlace()],
    })
    mockedTrip.list.mockResolvedValue({ data: [makeTrip()], total: 1 })
    renderView()

    await user.click(
      await screen.findByRole("button", { name: "Add to Itinerary" }),
    )
    await screen.findByText("Add to Your Itinerary")

    const modal = screen
      .getByRole("heading", { name: "Add to Your Itinerary" })
      .closest(".fixed") as HTMLElement
    expect(
      within(modal).getByDisplayValue("Historic north"),
    ).toBeInTheDocument()
    expect(within(modal).getByDisplayValue("2026-12-01")).toHaveValue(
      "2026-12-01",
    )
    expect(within(modal).getByDisplayValue("10:00")).toHaveValue("10:00")

    await user.click(
      within(modal).getByRole("button", { name: "Confirm & Add to Schedule" }),
    )

    await waitFor(() => expect(mockedTrip.addItem).toHaveBeenCalledTimes(1))
    expect(mockedTrip.addItem).toHaveBeenCalledWith("trip-1", {
      placeId: "p1",
      title: "Visit National Museum of Ethiopia",
      dayDate: "2026-12-01",
      startTime: "10:00",
      notes: "Visit to National Museum of Ethiopia",
      itemType: "PLACE",
      currency: "ETB",
    })
    expect(useToastStore.getState().toasts[0]).toMatchObject({
      title: "Added to Itinerary!",
    })
    expect(screen.queryByText("Add to Your Itinerary")).not.toBeInTheDocument()
  })

  it("switches between the grid and the map view", async () => {
    const user = userEvent.setup()
    mockedDiscover.nearby.mockResolvedValue({
      center: {},
      total: 1,
      data: [makePlace()],
    })
    const { container } = renderView()

    await screen.findByText("National Museum of Ethiopia")

    await user.click(screen.getByRole("button", { name: /Map View/ }))

    const map = await screen.findByTestId("heritage-map")
    expect(map).toHaveAttribute("data-place-count", "1")
    expect(
      screen.getByText(/Addis Ababa \(Center\) · 1 places/),
    ).toBeInTheDocument()
    expect(
      container.ownerDocument.getElementById("discover-explorer"),
    ).toBeTruthy()

    await user.click(screen.getByRole("button", { name: /Grid/ }))
    expect(screen.queryByTestId("heritage-map")).not.toBeInTheDocument()
    expect(screen.getByText("National Museum of Ethiopia")).toBeInTheDocument()
  })
})
