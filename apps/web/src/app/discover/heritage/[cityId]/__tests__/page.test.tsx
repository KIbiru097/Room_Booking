import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import HeritageCityPage from "@/app/discover/heritage/[cityId]/page"
import { discoverApi, tripApi } from "@/lib/services"
import { useAuth } from "@/lib/auth-store"
import { useToastStore } from "@/components/ui/Toast"
import { writeCachedValue } from "@/lib/offline-cache"
import type {
  CityHistoryResponse,
  DestinationDetail,
  PlaceItem,
  Trip,
} from "@/lib/services"

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
  default: (props: { initialPrompt?: string }) => (
    <div data-testid="ai-chat" data-prompt={props.initialPrompt ?? ""} />
  ),
}))

jest.mock("@/lib/heritage-content", () => ({ getHeritageContent: () => null }))

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
]

const HERITAGE_PLACES: PlaceItem[] = [
  place({
    id: "h-p1",
    name: "Empress Mentewab Palace",
    category: "HERITAGE",
    distanceKm: 1.8,
  }),
  place({
    id: "h-p2",
    name: "Sanko Littensos Stele Field",
    category: "ARCHAEOLOGY",
    distanceKm: 0.9,
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

const HISTORY: CityHistoryResponse = {
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
}

const EMPTY_HISTORY: CityHistoryResponse = {
  ...HISTORY,
  timeline: [],
  stories: [],
  culture: [],
}

const TRIP: Trip = {
  id: "trip-1",
  title: "Gondar Weekend",
  startDate: "2026-06-01T00:00:00.000Z",
  endDate: "2026-06-04T00:00:00.000Z",
  timezone: "Africa/Addis_Ababa",
  items: [],
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
  mockHeritage.mockResolvedValue({ total: 2, data: HERITAGE_PLACES })
  mockHistory.mockResolvedValue(HISTORY)
  mockTrips.mockResolvedValue({ data: [TRIP], total: 1 })
})

it("renders skeletons while the first load is still pending", () => {
  mockDestination.mockReturnValue(new Promise(() => {}))
  const { container } = render(<HeritageCityPage />)
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0)
  expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument()
}, 15000)

it("shows the not-found state and goes back to Discover when loading fails", async () => {
  mockDestination.mockRejectedValue(new Error("Network down"))
  mockHeritage.mockRejectedValue(new Error("Network down"))
  mockHistory.mockRejectedValue(new Error("Network down"))

  render(<HeritageCityPage />)

  expect(
    await screen.findByRole("heading", {
      level: 4,
      name: "Destination not found",
    }),
  ).toBeInTheDocument()
  expect(screen.getByText("Network down")).toBeInTheDocument()
  await userEvent.click(
    screen.getByRole("button", { name: "Back to Discover" }),
  )
  expect(mockPush).toHaveBeenCalledWith("/discover")
}, 15000)

it("renders the cached snapshot with an offline notice when the network fails", async () => {
  writeCachedValue("heritage-city-gondar", {
    destination: DESTINATION,
    heritagePlaces: HERITAGE_PLACES,
    history: HISTORY,
  })
  mockDestination.mockRejectedValue(new Error("offline"))
  mockHeritage.mockRejectedValue(new Error("offline"))
  mockHistory.mockRejectedValue(new Error("offline"))

  render(<HeritageCityPage />)

  expect(
    await screen.findByRole("heading", { level: 1, name: /Gondar/ }),
  ).toBeInTheDocument()
  expect(
    screen.getByText(
      /Offline Mode · You can still explore your saved heritage information/,
    ),
  ).toBeInTheDocument()
  expect(screen.getByText(/Last updated just now/)).toBeInTheDocument()
  expect(screen.queryByText("Destination not found")).not.toBeInTheDocument()
}, 15000)

it("renders the hero with stats and the verified source", async () => {
  render(<HeritageCityPage />)

  expect(
    await screen.findByRole("heading", { level: 1, name: /Gondar · Ethiopia/ }),
  ).toBeInTheDocument()
  expect(screen.getByText("4 verified places")).toBeInTheDocument()
  expect(screen.getByText("2 heritage sites")).toBeInTheDocument()
  expect(screen.getByText("2 stays")).toBeInTheDocument()
  expect(
    screen.getByText(/Sourced from Ethiopian Heritage Authority/),
  ).toBeInTheDocument()
  expect(screen.getByText("Imperial city of castles.")).toBeInTheDocument()
}, 15000)

it("opens and closes the full story modal", async () => {
  render(<HeritageCityPage />)
  await screen.findByRole("heading", { level: 2, name: "The Story of Gondar" })

  await userEvent.click(screen.getByRole("button", { name: /Read Full Story/ }))
  const modal = screen.getByRole("heading", {
    level: 3,
    name: "The History & Heritage of Gondar",
  })
  expect(
    within(modal.closest(".fixed") as HTMLElement).getByText(/founded in 1636/),
  ).toBeInTheDocument()

  await userEvent.click(screen.getByRole("button", { name: "Close" }))
  expect(
    screen.queryByRole("heading", {
      level: 3,
      name: "The History & Heritage of Gondar",
    }),
  ).not.toBeInTheDocument()
}, 15000)

it("renders the timeline with citations and opens an entry detail modal", async () => {
  render(<HeritageCityPage />)
  await screen.findByRole("heading", { level: 2, name: "Gondar Through Time" })

  expect(
    screen.getByRole("heading", { level: 3, name: "Capital founded" }),
  ).toBeInTheDocument()
  expect(
    screen.getByText(/Emperor Fasilides established his court/),
  ).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "UNESCO" })).toHaveAttribute(
    "href",
    "https://whc.unesco.org",
  )
  expect(screen.getByText(/Institute of Ethiopian Studies/)).toBeInTheDocument()

  await userEvent.click(screen.getByRole("button", { name: "Capital founded" }))
  const modal = screen.getByRole("heading", { level: 3, name: "1636" })
  const overlay = modal.closest(".fixed") as HTMLElement
  expect(
    within(overlay).getByRole("heading", { level: 4, name: "Capital founded" }),
  ).toBeInTheDocument()
  expect(within(overlay).getByText(/Emperor Fasilides/)).toBeInTheDocument()

  await userEvent.click(within(overlay).getByRole("button"))
  expect(
    screen.queryByRole("heading", { level: 3, name: "1636" }),
  ).not.toBeInTheDocument()
}, 15000)

it("renders the story card and opens the story detail modal", async () => {
  render(<HeritageCityPage />)
  await screen.findByRole("heading", { level: 2, name: "Stories of the City" })

  expect(
    screen.getByRole("heading", { level: 3, name: "The Royal Chronicle" }),
  ).toBeInTheDocument()
  await userEvent.click(
    screen.getByRole("heading", { level: 3, name: "The Royal Chronicle" }),
  )

  const modal = screen
    .getAllByRole("heading", { level: 3, name: "The Royal Chronicle" })
    .find((el) => el.closest(".fixed")) as HTMLElement
  const overlay = modal.closest(".fixed") as HTMLElement
  expect(
    within(overlay).getByText(/Scribes recorded every campaign/),
  ).toBeInTheDocument()
  expect(within(overlay).getByRole("link")).toHaveAttribute(
    "href",
    "/discover/p1",
  )
}, 15000)

it("shows the empty states for timeline, stories and culture", async () => {
  mockHistory.mockResolvedValue(EMPTY_HISTORY)
  render(<HeritageCityPage />)

  expect(
    await screen.findByRole("heading", {
      level: 4,
      name: "No curated timeline for this city yet",
    }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("heading", { level: 4, name: "No verified stories yet" }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("heading", { level: 4, name: "No culture notes yet" }),
  ).toBeInTheDocument()
}, 15000)

it("renders the culture notes section", async () => {
  render(<HeritageCityPage />)
  const culture = await screen.findByRole("region", {
    name: "Culture & Traditions",
  })
  expect(
    within(culture).getByRole("heading", {
      level: 3,
      name: "Timkat Processions",
    }),
  ).toBeInTheDocument()
  expect(within(culture).getByText(/Epiphany celebrations/)).toBeInTheDocument()
}, 15000)

it("links every stay card to its hotel detail page", async () => {
  render(<HeritageCityPage />)
  const stays = await screen.findByRole("region", { name: "Stay Nearby" })

  expect(
    within(stays).getByRole("link", { name: /Gondar Castle Lodge/ }),
  ).toHaveAttribute("href", "/hotel/h1")
  expect(
    within(stays).getByRole("link", { name: /Quaint Gondar Inn/ }),
  ).toHaveAttribute("href", "/hotel/h2")
  expect(within(stays).getAllByText("View Stay")).toHaveLength(2)
}, 15000)

it("toggles the city favorite and announces it with a toast", async () => {
  render(<HeritageCityPage />)
  const favorite = await screen.findByRole("button", { name: "Save" })

  await userEvent.click(favorite)
  expect(useToastStore.getState().toasts.at(-1)).toMatchObject({
    type: "success",
    title: "Saved",
    message: "Gondar",
  })

  await userEvent.click(screen.getByRole("button", { name: "Save" }))
  expect(useToastStore.getState().toasts.at(-1)).toMatchObject({
    type: "success",
    title: "Save",
    message: "Gondar",
  })
}, 15000)

it("scrolls to the explorer and AI sections from the hero CTAs", async () => {
  render(<HeritageCityPage />)
  await screen.findByRole("heading", { level: 2, name: "The Story of Gondar" })

  await userEvent.click(
    screen.getByRole("button", { name: /Explore Heritage/ }),
  )
  expect(Element.prototype.scrollIntoView).toHaveBeenCalled()

  const scrollMock = Element.prototype.scrollIntoView as jest.Mock
  scrollMock.mockClear()
  const askAiButtons = screen.getAllByRole("button", { name: /Ask AI$/ })
  expect(askAiButtons.length).toBeGreaterThan(1)
  await userEvent.click(askAiButtons[0])
  expect(scrollMock).toHaveBeenCalled()
}, 15000)

it("keeps the trips request quiet until a user is signed in", async () => {
  render(<HeritageCityPage />)
  await screen.findByRole("heading", { level: 2, name: "The Story of Gondar" })
  expect(mockTrips).not.toHaveBeenCalled()
}, 15000)

it("signs in from the AI Historian gate and swaps in the chat when signed in", async () => {
  render(<HeritageCityPage />)
  const aiSection = await screen.findByRole("region", {
    name: "Ask me about Gondar",
  })

  expect(
    within(aiSection).getByRole("heading", {
      level: 4,
      name: "Sign in to use the AI Historian",
    }),
  ).toBeInTheDocument()
  await userEvent.click(
    within(aiSection).getByRole("button", { name: "Sign In" }),
  )
  expect(mockPush).toHaveBeenCalledWith("/auth")
  expect(within(aiSection).queryByTestId("ai-chat")).not.toBeInTheDocument()

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
  mockTrips.mockResolvedValue({ data: [], total: 0 })

  await waitFor(() =>
    expect(within(aiSection).getByTestId("ai-chat")).toBeInTheDocument(),
  )
  await userEvent.click(
    within(aiSection).getByRole("button", {
      name: /Why is this place historically important/,
    }),
  )
  expect(within(aiSection).getByTestId("ai-chat")).toHaveAttribute(
    "data-prompt",
    "Why is this place historically important? (regarding Gondar)",
  )
}, 15000)
