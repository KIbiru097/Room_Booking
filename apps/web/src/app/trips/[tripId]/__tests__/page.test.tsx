import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TripDetailPage from "@/app/trips/[tripId]/page"
import { tripApi } from "@/lib/services"
import { useAuth } from "@/lib/auth-store"
import { formatEthiopianBirr } from "@/lib/currency"
import type { Trip, TripItem } from "@/lib/services"

const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/trips/trip-1",
  useParams: () => ({ tripId: "trip-1" }),
  useSearchParams: () => new URLSearchParams(""),
}))

jest.mock("@/lib/services", () => ({
  tripApi: {
    get: jest.fn(),
    list: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    buildDay: jest.fn(),
  },
}))

const mockGet = tripApi.get as jest.Mock

const COFFEE: TripItem = {
  id: "i1",
  tripId: "trip-1",
  dayDate: "2026-02-01",
  startTime: "09:00",
  durationMin: 120,
  itemType: "CUSTOM",
  title: "Coffee ceremony at Tomoca",
  notes: "Bring cash",
  costAmount: 500,
  currency: "ETB",
  status: "PLANNED",
  createdBy: "USER",
}

const MUSEUM: TripItem = {
  id: "i2",
  tripId: "trip-1",
  dayDate: "2026-02-02",
  startTime: "14:00",
  durationMin: 90,
  itemType: "CUSTOM",
  title: "Visit National Museum",
  costAmount: 1000,
  currency: "ETB",
  status: "DONE",
  createdBy: "USER",
}

const TRIP: Trip = {
  id: "trip-1",
  title: "Addis Weekend",
  startDate: "2026-02-01T00:00:00.000Z",
  endDate: "2026-02-03T00:00:00.000Z",
  timezone: "Africa/Addis_Ababa",
  items: [COFFEE, MUSEUM],
}

const CUSTOMER = {
  id: "u1",
  email: "guest@example.com",
  fullName: "Guest One",
  role: "CUSTOMER" as const,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

function signIn() {
  useAuth.setState({
    user: CUSTOMER,
    tokens: { accessToken: "a", refreshToken: "r" },
    loading: false,
    isInitialized: true,
    isAdmin: false,
    isManager: false,
    isStaff: false,
    isCustomer: true,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  signIn()
  mockGet.mockResolvedValue(TRIP)
})

describe("trip detail page", () => {
  it("sends signed-out visitors to the auth screen", async () => {
    useAuth.setState({
      user: null,
      tokens: null,
      isInitialized: true,
      isCustomer: false,
    })

    const { container } = render(<TripDetailPage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        "/auth?returnTo=%2Ftrips%2Ftrip-1",
      ),
    )
    expect(container).toBeEmptyDOMElement()
    expect(mockGet).not.toHaveBeenCalled()
  })

  it("renders a skeleton while the itinerary is loading", async () => {
    let resolveTrip: (value: Trip) => void = () => undefined
    mockGet.mockReturnValue(
      new Promise<Trip>((resolve) => (resolveTrip = resolve)),
    )

    const { container } = render(<TripDetailPage />)
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    )

    await act(async () => {
      resolveTrip(TRIP)
    })
    expect(
      await screen.findByRole("heading", { name: "Addis Weekend" }),
    ).toBeInTheDocument()
  })

  it("shows the not-found view when the itinerary cannot be loaded", async () => {
    mockGet.mockRejectedValue(new Error("boom"))

    render(<TripDetailPage />)

    expect(
      await screen.findByRole("heading", { name: "Trip Not Found" }),
    ).toBeInTheDocument()
    expect(screen.getByText("boom")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Back to My Trips/ }),
    ).toHaveAttribute("href", "/trips")
  })

  it("falls back to the generic load error when the failure is not an Error", async () => {
    mockGet.mockRejectedValue("socket hang up")

    render(<TripDetailPage />)

    expect(
      await screen.findByRole("heading", { name: "Trip Not Found" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Unable to load this trip itinerary."),
    ).toBeInTheDocument()
  })

  it("falls back to the offline cache and flags the itinerary as stale", async () => {
    mockGet.mockRejectedValue(new Error("network down"))
    localStorage.setItem(
      "hotel-system:web-cache:trip:anonymous:trip-1",
      JSON.stringify({ value: TRIP, savedAt: Date.now() - 5 * 60000 }),
    )

    render(<TripDetailPage />)

    expect(
      await screen.findByRole("heading", { name: "Addis Weekend" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Showing this itinerary from 5 min ago. Changes require a connection.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument()
  })

  it("renders the summary, budget totals, day tabs, and activities", async () => {
    render(<TripDetailPage />)

    expect(
      await screen.findByRole("heading", { name: "Addis Weekend" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Private Stay Itinerary")).toBeInTheDocument()
    expect(screen.getByText("3 days")).toBeInTheDocument()

    expect(screen.getByText(formatEthiopianBirr(1500))).toBeInTheDocument()
    expect(
      screen.getByText("Done: " + formatEthiopianBirr(1000)),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Planned: " + formatEthiopianBirr(500)),
    ).toBeInTheDocument()
    expect(screen.getByText(/\(~\$12\.00\)/)).toBeInTheDocument()

    expect(
      screen.getByRole("button", { name: "All Days (2)" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^Day 1/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^Day 3/ })).toBeInTheDocument()

    expect(
      screen.getByRole("heading", { name: "Coffee ceremony at Tomoca" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Visit National Museum" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Dining & Coffee")).toBeInTheDocument()
    expect(screen.getByText("Heritage & Culture")).toBeInTheDocument()
    expect(screen.getByText(/120 min/)).toBeInTheDocument()
    expect(screen.getByText("Bring cash")).toBeInTheDocument()
    expect(screen.getAllByRole("combobox")).toHaveLength(2)
  })

  it("filters the timeline by day", async () => {
    const user = userEvent.setup()
    render(<TripDetailPage />)
    await screen.findByRole("heading", { name: "Addis Weekend" })

    await user.click(screen.getByRole("button", { name: /^Day 2/ }))

    expect(
      screen.getByRole("heading", { name: "Visit National Museum" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Coffee ceremony at Tomoca" }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "All Days (2)" }))

    expect(
      screen.getByRole("heading", { name: "Coffee ceremony at Tomoca" }),
    ).toBeInTheDocument()
  })

  it("offers the empty state for a day without activities", async () => {
    const user = userEvent.setup()
    render(<TripDetailPage />)
    await screen.findByRole("heading", { name: "Addis Weekend" })

    await user.click(screen.getByRole("button", { name: /^Day 3/ }))

    expect(
      screen.getByRole("heading", {
        name: "No activities scheduled for this view",
      }),
    ).toBeInTheDocument()
    const emptyPanel = screen
      .getByRole("heading", { name: "No activities scheduled for this view" })
      .closest("div") as HTMLElement
    expect(
      within(emptyPanel).getByRole("button", { name: /Add Activity/ }),
    ).toBeInTheDocument()
    expect(
      within(emptyPanel).getByRole("link", { name: /Discover Places/ }),
    ).toHaveAttribute("href", "/discover")
  })

  it("opens the add activity form from the empty state call to action", async () => {
    const user = userEvent.setup()
    render(<TripDetailPage />)
    await screen.findByRole("heading", { name: "Addis Weekend" })

    await user.click(screen.getByRole("button", { name: /^Day 3/ }))
    const emptyPanel = screen
      .getByRole("heading", { name: "No activities scheduled for this view" })
      .closest("div") as HTMLElement
    await user.click(
      within(emptyPanel).getByRole("button", { name: /Add Activity/ }),
    )

    expect(
      screen.getByRole("heading", { name: "Add Itinerary Activity" }),
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("e.g. Visit National Museum & Lucy"),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Overlapping timed activities will generate an overlap warning banner.",
      ),
    ).toBeInTheDocument()
    const dateField = screen.getByDisplayValue("2026-02-03") as HTMLInputElement
    expect(dateField).toBeInTheDocument()
    expect(
      within(dateField.closest("form") as HTMLElement).getByRole("button", {
        name: "Add to Itinerary",
      }),
    ).toBeEnabled()
  })
})
