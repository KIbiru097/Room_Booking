import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import HeritageCityPage from "@/app/discover/heritage/[cityId]/page"
import { discoverApi, tripApi } from "@/lib/services"
import type {
  BuildDayResponse,
  CityHistoryResponse,
  DestinationDetail,
  PlaceItem,
  Trip,
} from "@/lib/services"
import { useAuth } from "@/lib/auth-store"
import { useToastStore } from "@/components/ui/Toast"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/discover/heritage/gondar",
  useParams: () => ({ cityId: "gondar" }),
  useSearchParams: () => new URLSearchParams(""),
}))

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => () => null,
}))

jest.mock("@/components/AIChat", () => ({
  __esModule: true,
  default: () => <div data-testid="ai-chat" />,
}))

jest.mock("@/lib/heritage-content", () => ({
  getHeritageContent: () => ({
    key: "gondar",
    cityName: "Gondar",
    tagline: "Imperial city of castles.",
    fullStory: {
      lead: "Gondar began as a royal capital in 1636.",
      sections: [
        {
          heading: "The Fasilides Era",
          era: "1632–1667",
          body: "Fasilides moved the court to Gondar.",
        },
        {
          heading: "The Library",
          era: "1706",
          body: "Manuscripts were copied and stored here.",
        },
      ],
      keyDates: [
        { year: "1636", event: "Permanent capital established" },
        { year: "1769", event: "Ras Mikael Sehul era begins" },
      ],
      curatorNote: "Compiled from published catalogues.",
    },
    timeline: [],
    stories: [],
    culture: [],
    primaryCitation: { name: "UNESCO" },
  }),
}))

jest.mock("@/lib/services", () => ({
  discoverApi: {
    destination: jest.fn(),
    heritageForCity: jest.fn(),
    history: jest.fn(),
  },
  tripApi: { list: jest.fn(), addItem: jest.fn(), buildDay: jest.fn() },
}))

const mockDestination = discoverApi.destination as jest.Mock
const mockHeritage = discoverApi.heritageForCity as jest.Mock
const mockHistory = discoverApi.history as jest.Mock
const mockTrips = tripApi.list as jest.Mock
const mockAddItem = tripApi.addItem as jest.Mock
const mockBuildDay = tripApi.buildDay as jest.Mock

const place = (
  over: Partial<PlaceItem> & { id: string ;name: string },
): PlaceItem => ({
  description: "Verified heritage place.",
  category: "HERITAGE",
  status: "ACTIVE",
  address: "Gondar, Ethiopia",
  lat: 12.6,
  lng: 37.47,
  hoursVerified: true,
  rating: 4.5,
  images: [],
  distanceKm: 1,
  ...over,
})

const PLACES: PlaceItem[] = [
  place({
    id: "p1",
    name: "Fasil Ghebbi",
    category: "CASTLE",
    distanceKm: 0.4,
  }),
  place({
    id: "p2",
    name: "Debre Berhan Selassie Church",
    category: "RELIGIOUS",
    distanceKm: 3.2,
  }),
  place({
    id: "p3",
    name: "Royal Bath of Fasilides",
    category: "MUSEUM",
    distanceKm: 7.5,
  }),
  place({
    id: "p4",
    name: "Witch's Pool",
    category: "HERITAGE",
    distanceKm: undefined,
  }),
]

const DESTINATION: DestinationDetail = {
  id: "gondar",
  name: "Gondar",
  description: "Imperial capital of Ethiopia.",
  heroImage: null,
  country: { id: "et", name: "Ethiopia", code: "ET" },
  placeCount: 4,
  hotelCount: 2,
  places: PLACES,
  hotels: [
    {
      id: "h1",
      name: "Gondar Castle Lodge",
      address: "Fasil Rd",
      lat: 12.6,
      lng: 37.47,
      starRating: 4,
      images: [],
    },
    {
      id: "h2",
      name: "Quaint Gondar Inn",
      address: "Debre Berhan St",
      lat: 12.61,
      lng: 37.48,
      starRating: 3,
      images: [],
    },
  ],
}

const HISTORY = {
  city: {
    id: "gondar",
    name: "Gondar",
    country: { id: "et", name: "Ethiopia", code: "ET" },
  },
  tagline: "Imperial city of castles.",
  overview: "Gondar was founded in 1636 as the permanent capital of Ethiopia.",
  timeline: [
    {
      id: "t1",
      period: "1636",
      title: "Capital founded",
      body: "Emperor Fasilides established his court beside Lake Tana.",
      citation: { name: "UNESCO", url: "https://whc.unesco.org" },
      relatedPlaceId: "p1",
      highlights: ["Royal enclosure laid out", "First stone palace completed"],
    },
    {
      id: "t2",
      period: "1706",
      title: "Library of Iyasu",
      body: "A royal library held hundreds of manuscripts.",
      citation: { name: "Institute of Ethiopian Studies" },
    },
  ],
  stories: [
    {
      id: "s1",
      title: "The Royal Chronicle",
      body: "Scribes recorded every campaign of the emperors.",
      placeId: "p1",
      citation: { name: "UNESCO" },
    },
  ],
  culture: [
    {
      id: "c1",
      title: "Timkat Processions",
      body: "Epiphany celebrations fill the streets each January.",
    },
  ],
  source: {
    id: "src1",
    name: "Ethiopian Heritage Authority",
    url: "https://eha.et",
    license: "CC BY",
  },
  verifiedAt: "2026-01-01T00:00:00.000Z",
} as unknown as CityHistoryResponse

const TRIP: Trip = {
  id: "trip-1",
  title: "Gondar Weekend",
  startDate: "2026-06-01T00:00:00.000Z",
  endDate: "2026-06-04T00:00:00.000Z",
  timezone: "Africa/Addis_Ababa",
  items: [],
}

const TRIP_TWO: Trip = {
  ...TRIP,
  id: "trip-2",
  title: "Castles Extension",
  startDate: "2026-07-10T00:00:00.000Z",
  endDate: "2026-07-16T00:00:00.000Z",
}

const PROPOSAL: BuildDayResponse = {
  tripId: "trip-2",
  dayDate: "2026-07-12",
  duration: "FULL_DAY",
  scope: "city_interests",
  cityId: "gondar",
  cityName: "Gondar",
  interestsApplied: ["heritage", "food"],
  proposal: [
    {
      placeId: "p1",
      title: "Fasil Ghebbi",
      dayDate: "2026-07-12",
      startTime: "11:30",
      durationMin: 120,
      category: "CASTLE",
      notes: null,
      estimatedCostEtb: 500,
      place: {
        id: "p1",
        name: "Fasil Ghebbi",
        category: "CASTLE",
        address: "Gondar, Ethiopia",
        images: [],
      },
    },
  ],
  totalDurationMin: 120,
  estimatedBudgetEtb: 500,
}

const signIn = () =>
  useAuth.setState({
    user: {
      id: "u1",
      email: "guest@example.com",
      fullName: "Guest",
      role: "CUSTOMER",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    tokens: { accessToken: "a", refreshToken: "r" },
    isCustomer: true,
    isInitialized: true,
  } as never)

const renderPage = async () => {
  render(<HeritageCityPage />)
  await screen.findByRole("heading", { level: 1, name: /Gondar/ })
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
  Element.prototype.scrollIntoView = jest.fn()
  mockDestination.mockResolvedValue(DESTINATION)
  mockHeritage.mockResolvedValue({ total: 4, data: PLACES })
  mockHistory.mockResolvedValue(HISTORY)
  mockTrips.mockResolvedValue({ data: [TRIP, TRIP_TWO], total: 2 })
  mockBuildDay.mockResolvedValue(PROPOSAL)
  mockAddItem.mockResolvedValue({
    hasConflict: false,
    conflictWith: [],
    item: { id: "i1" },
  })
})

describe("Heritage city explorer controls", () => {
  it("measures a missing distance from the active hotel", async () => {
    await renderPage()
    await screen.findByRole("heading", {
      level: 2,
      name: "Heritage Near Your Hotel",
    })
    expect(screen.getAllByText("Witch's Pool").length).toBeGreaterThan(0)
    expect(screen.getAllByText(/↓ \d+/).length).toBeGreaterThan(0)
  }, 15000)

  it("drives the category chips, radius filters, search and list mode", async () => {
    const user = userEvent.setup()
    await renderPage()

    for (const label of [
      "Historic Sites",
      "Castles",
      "Museums",
      "Religious",
      "Archaeology",
      "Culture",
    ]) {
      await user.click(screen.getByRole("button", { name: label }))
    }
    await user.click(screen.getAllByRole("button", { name: "All" })[0])

    await user.click(screen.getByRole("button", { name: "5 km" }))
    await user.click(screen.getByRole("button", { name: "10 km" }))
    await user.click(screen.getAllByRole("button", { name: "All" })[1])

    await user.click(screen.getByRole("button", { name: "List" }))
    expect(
      await screen.findByRole("button", { name: /Royal Bath of Fasilides/ }),
    ).toBeInTheDocument()

    const search = screen.getByPlaceholderText(
      "Search heritage places in Gondar...",
    )
    await user.type(search, "church")
    expect(
      screen.queryByRole("button", { name: /Royal Bath of Fasilides/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Debre Berhan Selassie Church/ }),
    ).toBeInTheDocument()
    await user.clear(search)

    await user.click(screen.getByRole("button", { name: /Fasil Ghebbi/ }))
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Royal Bath of Fasilides/ }),
      ).not.toBeInTheDocument(),
    )

    await user.click(
      screen
        .getAllByRole("button", { name: "Add to Trip" })
        .at(-1) as HTMLElement,
    )
    expect(mockPush).toHaveBeenCalledWith("/auth")

    await user.click(screen.getByRole("button", { name: "Map" }))
    expect(useToastStore.getState().toasts.at(-1)).toMatchObject({
      type: "info",
    })
  }, 15000)

  it("switches the route origin between hotels", async () => {
    await renderPage()
    const select = screen.getByRole("combobox")
    expect(select).toHaveValue("h1")
    const route = screen.getByRole("region", {
      name: "Heritage Near Your Hotel",
    })
    fireEvent.change(select, { target: { value: "h2" } })
    expect(select).toHaveValue("h2")
    expect(
      await within(route).findByRole("heading", { name: "Quaint Gondar Inn" }),
    ).toBeInTheDocument()
  }, 15000)
})

describe("Heritage city planner gates", () => {
  it("sends a signed-out planner to sign in", async () => {
    const user = userEvent.setup()
    await renderPage()

    const addButtons = screen.getAllByRole("button", { name: "Add to Trip" })
    await user.click(addButtons[0])

    expect(mockPush).toHaveBeenCalledWith("/auth")
    expect(useToastStore.getState().toasts.at(-1)).toMatchObject({
      type: "info",
    })
    expect(
      screen.queryByRole("heading", { name: "Add to Trip" }),
    ).not.toBeInTheDocument()

    const build = screen.getByRole("region", { name: "Build My Heritage Day" })
    await user.click(within(build).getByRole("button", { name: "Sign In" }))
    expect(mockPush).toHaveBeenCalledWith("/auth")
  }, 15000)

  it("offers trip creation when a signed-in planner has no trips", async () => {
    signIn()
    mockTrips.mockResolvedValue({ data: [], total: 0 })
    const user = userEvent.setup()
    await renderPage()

    const build = await screen.findByRole("region", {
      name: "Build My Heritage Day",
    })
    expect(
      within(build).getByRole("heading", { name: "Create a trip first" }),
    ).toBeInTheDocument()
    await user.click(
      within(build).getByRole("button", { name: "Create a trip" }),
    )
    expect(mockPush).toHaveBeenCalledWith("/trips")
  }, 15000)

  it("falls back to the empty trip state when the trips request fails", async () => {
    signIn()
    mockTrips.mockRejectedValue(new Error("trips down"))
    await renderPage()

    const build = await screen.findByRole("region", {
      name: "Build My Heritage Day",
    })
    expect(
      within(build).getByRole("heading", { name: "Create a trip first" }),
    ).toBeInTheDocument()
  }, 15000)
})

describe("Heritage city story surfaces", () => {
  it("opens a timeline entry from its card and stops citation clicks bubbling", async () => {
    await renderPage()
    await screen.findByRole("heading", {
      level: 2,
      name: "Gondar Through Time",
    })

    fireEvent.click(screen.getByText(/Emperor Fasilides established his court/))
    const modal = await screen.findByRole("heading", { level: 3, name: "1636" })
    expect(
      within(modal.closest(".fixed") as HTMLElement).getByText(
        /Period Highlights/,
      ),
    ).toBeInTheDocument()
    fireEvent.click(
      within(modal.closest(".fixed") as HTMLElement).getAllByRole("button")[0],
    )
    expect(
      screen.queryByRole("heading", { level: 3, name: "1636" }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("link", { name: "UNESCO" }))
    expect(
      screen.getByRole("heading", { level: 2, name: "Gondar Through Time" }),
    ).toBeInTheDocument()
  }, 15000)

  it("renders curated sections and key dates in the full story reader", async () => {
    const user = userEvent.setup()
    await renderPage()
    await screen.findByRole("heading", {
      level: 2,
      name: "The Story of Gondar",
    })

    await user.click(screen.getByRole("button", { name: /Read Full Story/ }))
    const overlay = screen
      .getByRole("heading", {
        level: 3,
        name: "The History & Heritage of Gondar",
      })
      .closest(".fixed") as HTMLElement

    expect(
      within(overlay).getByRole("heading", { name: "The Fasilides Era" }),
    ).toBeInTheDocument()
    expect(
      within(overlay).getByRole("heading", {
        name: "Key Historical Milestones",
      }),
    ).toBeInTheDocument()
    expect(within(overlay).getByText("1636")).toBeInTheDocument()
    expect(within(overlay).getByText("1769")).toBeInTheDocument()

    await user.click(within(overlay).getAllByRole("button")[0])
    expect(
      screen.queryByRole("heading", {
        level: 3,
        name: "The History & Heritage of Gondar",
      }),
    ).not.toBeInTheDocument()
  }, 15000)

  it("closes the story reader from the header button", async () => {
    const user = userEvent.setup()
    await renderPage()
    await screen.findByRole("heading", {
      level: 2,
      name: "Stories of the City",
    })

    await user.click(
      screen.getByRole("heading", { level: 3, name: "The Royal Chronicle" }),
    )
    const overlay = document.querySelector(".fixed") as HTMLElement
    await user.click(within(overlay).getAllByRole("button")[0])

    expect(document.querySelector(".fixed")).toBeNull()
  }, 15000)
})

describe("Heritage city day builder", () => {
  it("builds a day, renders the proposal and saves it to the trip", async () => {
    const user = userEvent.setup()
    signIn()
    await renderPage()

    const tripSelect = (await screen.findByLabelText(
      "Trip",
    )) as HTMLSelectElement
    await waitFor(() => expect(tripSelect.value).toBe("trip-1"))

    fireEvent.change(tripSelect, { target: { value: "trip-2" } })
    await waitFor(() => expect(tripSelect.value).toBe("trip-2"))

    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2026-07-12" },
    })
    fireEvent.change(screen.getByLabelText("Start time"), {
      target: { value: "11:30" },
    })
    await user.click(screen.getByRole("button", { name: "Full Day" }))
    await user.click(screen.getByRole("button", { name: "Food & Coffee" }))

    await user.click(screen.getByRole("button", { name: /Create My Day/ }))

    await waitFor(() =>
      expect(mockBuildDay).toHaveBeenCalledWith("trip-2", {
        dayDate: "2026-07-12",
        duration: "FULL_DAY",
        startTime: "11:30",
        cityId: "gondar",
        interests: expect.arrayContaining(["food"]),
      }),
    )

    expect(await screen.findByText("Your Heritage Day")).toBeInTheDocument()
    expect(screen.getByText(/120 min · about 500 ETB/)).toBeInTheDocument()
    expect(screen.getByText("11:30")).toBeInTheDocument()

    mockAddItem.mockResolvedValueOnce({
      hasConflict: true,
      conflictWith: [],
      item: { id: "i1" },
    })
    await user.click(screen.getByRole("button", { name: /Add All To My Trip/ }))

    await waitFor(() => expect(mockAddItem).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/trips/trip-2"))
    expect(useToastStore.getState().toasts.at(-1)).toMatchObject({
      type: "success",
    })
  }, 15000)

  it("reports a failed build and an empty proposal", async () => {
    const user = userEvent.setup()
    signIn()
    await renderPage()
    await screen.findByLabelText("Trip")

    mockBuildDay.mockRejectedValueOnce(new Error("build-day endpoint down"))
    await user.click(screen.getByRole("button", { name: /Create My Day/ }))
    expect(
      await screen.findByText("build-day endpoint down"),
    ).toBeInTheDocument()
    expect(useToastStore.getState().toasts.at(-1)).toMatchObject({
      type: "error",
    })

    mockBuildDay.mockResolvedValueOnce({ ...PROPOSAL, proposal: [] })
    await user.click(screen.getByRole("button", { name: /Create My Day/ }))
    expect(
      await screen.findByText("No verified places to build from"),
    ).toBeInTheDocument()
    expect(useToastStore.getState().toasts.at(-1)).toMatchObject({
      type: "warning",
    })
  }, 15000)

  it("clears the proposal without saving it", async () => {
    const user = userEvent.setup()
    signIn()
    await renderPage()
    await screen.findByLabelText("Trip")

    await user.click(screen.getByRole("button", { name: /Create My Day/ }))
    await screen.findByText("Your Heritage Day")

    await user.click(screen.getByRole("button", { name: "Clear" }))
    expect(screen.queryByText("Your Heritage Day")).not.toBeInTheDocument()
    expect(mockAddItem).not.toHaveBeenCalled()
  }, 15000)
})

describe("Heritage city add to trip dialog", () => {
  const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
    const explorer = screen.getByRole("region", { name: "Heritage Explorer" })
    await user.click(
      within(explorer).getAllByRole("button", { name: "Add to Trip" })[0],
    )
    await screen.findByRole("heading", { name: "Add to Trip" })
  }

  it("dismisses the dialog from the header and from Cancel", async () => {
    const user = userEvent.setup()
    signIn()
    await renderPage()
    await openDialog(user)

    let overlay = screen
      .getByRole("heading", { name: "Add to Trip" })
      .closest(".fixed") as HTMLElement
    await user.click(within(overlay).getAllByRole("button")[0])
    expect(
      screen.queryByRole("heading", { name: "Add to Trip" }),
    ).not.toBeInTheDocument()

    await openDialog(user)
    overlay = (screen
      .getByRole("heading", { name: "Add to Trip" })
      .closest(".fixed") as HTMLElement)
    await user.click(within(overlay).getByRole("button", { name: "Cancel" }))
    expect(
      screen.queryByRole("heading", { name: "Add to Trip" }),
    ).not.toBeInTheDocument()
    expect(mockAddItem).not.toHaveBeenCalled()
  }, 15000)

  it("adds the place to the chosen trip", async () => {
    const user = userEvent.setup()
    signIn()
    await renderPage()
    await screen.findByLabelText("Trip")
    await openDialog(user)

    const overlay = screen
      .getByRole("heading", { name: "Add to Trip" })
      .closest(".fixed") as HTMLElement
    fireEvent.change(within(overlay).getByRole("combobox"), {
      target: { value: "trip-2" },
    })
    fireEvent.change(
      overlay.querySelector('input[type="date"]') as HTMLInputElement,
      {
        target: { value: "2026-07-12" },
      },
    )
    fireEvent.change(
      overlay.querySelector('input[type="time"]') as HTMLInputElement,
      {
        target: { value: "09:30" },
      },
    )
    await user.click(
      within(overlay).getByRole("button", { name: "Add to Trip" }),
    )

    await waitFor(() => expect(mockAddItem).toHaveBeenCalledTimes(1))
    expect(mockAddItem).toHaveBeenCalledWith(
      "trip-2",
      expect.objectContaining({
        placeId: "p1",
        dayDate: "2026-07-12",
        startTime: "09:30",
      }),
    )
    expect(
      screen.queryByRole("heading", { name: "Add to Trip" }),
    ).not.toBeInTheDocument()
    expect(useToastStore.getState().toasts.at(-1)).toMatchObject({
      type: "success",
    })
  }, 15000)

  it("reports a rejected add to trip", async () => {
    mockAddItem.mockRejectedValue(new Error("Itinerary service unavailable"))
    const user = userEvent.setup()
    signIn()
    await renderPage()
    await screen.findByLabelText("Trip")
    await openDialog(user)

    const overlay = screen
      .getByRole("heading", { name: "Add to Trip" })
      .closest(".fixed") as HTMLElement
    await user.click(
      within(overlay).getByRole("button", { name: "Add to Trip" }),
    )

    expect(useToastStore.getState().toasts.at(-1)).toMatchObject({
      type: "error",
      message: "Itinerary service unavailable",
    })
    expect(
      screen.getByRole("heading", { name: "Add to Trip" }),
    ).toBeInTheDocument()
  }, 15000)
})
