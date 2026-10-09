import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TripsPage from "@/app/trips/page"
import { tripApi } from "@/lib/services"
import type { Trip } from "@/lib/services"
import { useAuth } from "@/lib/auth-store"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/trips",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(""),
}))

jest.mock("@/lib/services", () => ({
  tripApi: {
    list: jest.fn(),
    create: jest.fn(),
    get: jest.fn(),
    addItem: jest.fn(),
  },
}))

const mockedTrip = tripApi as jest.Mocked<typeof tripApi>

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    title: "Historic north",
    startDate: "2026-12-01T00:00:00.000Z",
    endDate: "2026-12-07T00:00:00.000Z",
    timezone: "Africa/Addis_Ababa",
    hotel: null,
    booking: null,
    items: [],
    ...overrides,
  }
}

describe("trips page", () => {
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
    mockedTrip.list.mockReset()
    mockedTrip.create.mockReset()
  })

  it("shows the itinerary shell while the first page of trips loads", () => {
    mockedTrip.list.mockReturnValue(new Promise(() => undefined))

    render(<TripsPage />)

    expect(
      screen.getByRole("heading", { name: "My Trips" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Keep bookings, verified places, and your plans together.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("Loading trips…")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Discover places/ }),
    ).toHaveAttribute("href", "/discover")
    expect(
      screen.getByPlaceholderText("Trip title, e.g. Addis weekend"),
    ).toBeInTheDocument()
  })

  it("shows the empty itinerary state when the account has no trips", async () => {
    mockedTrip.list.mockResolvedValue({ data: [], total: 0 })

    render(<TripsPage />)

    expect(await screen.findByText("No trips yet")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Create a private itinerary, then add verified places or custom activities.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: /itinerary items/ }),
    ).not.toBeInTheDocument()
  })

  it("links every saved itinerary to its detail page", async () => {
    mockedTrip.list.mockResolvedValue({
      data: [
        makeTrip(),
        makeTrip({
          id: "trip-2",
          title: "Lalibela weekend",
          startDate: "2026-11-02T00:00:00.000Z",
          endDate: "2026-11-05T00:00:00.000Z",
          items: [{ id: "i1" } as never],
        }),
      ],
      total: 2,
    })

    render(<TripsPage />)

    const first = await screen.findByRole("link", { name: /Historic north/ })
    expect(first).toHaveAttribute("href", "/trips/trip-1")
    expect(first).toHaveTextContent("0 itinerary items")
    expect(first).toHaveTextContent("2026-12-01 — 2026-12-07")

    const second = screen.getByRole("link", { name: /Lalibela weekend/ })
    expect(second).toHaveAttribute("href", "/trips/trip-2")
    expect(second).toHaveTextContent("1 itinerary items")

    expect(mockedTrip.list).toHaveBeenCalledTimes(1)
  })

  it("creates a trip from the form and appends it to the list", async () => {
    const user = userEvent.setup()
    mockedTrip.list.mockResolvedValue({ data: [makeTrip()], total: 1 })
    mockedTrip.create.mockResolvedValue(
      makeTrip({ id: "trip-3", title: "Addis weekend", items: [] }),
    )

    render(<TripsPage />)

    await screen.findByRole("link", { name: /Historic north/ })

    await user.type(
      screen.getByPlaceholderText("Trip title, e.g. Addis weekend"),
      "Addis weekend",
    )
    await user.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() => expect(mockedTrip.create).toHaveBeenCalledTimes(1))
    expect(mockedTrip.create).toHaveBeenCalledWith({
      title: "Addis weekend",
      startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    })

    expect(
      await screen.findByRole("link", { name: /Addis weekend/ }),
    ).toHaveAttribute("href", "/trips/trip-3")
    expect(
      screen.getByPlaceholderText("Trip title, e.g. Addis weekend"),
    ).toHaveValue("")
  })

  it("shows the load failure when there is no offline copy", async () => {
    mockedTrip.list.mockRejectedValue(new Error("Network Error"))

    render(<TripsPage />)

    expect(await screen.findByText("Network Error")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument()
  })

  it("falls back to the cached itinerary list and flags the data as stale", async () => {
    const user = userEvent.setup()
    mockedTrip.list.mockResolvedValueOnce({ data: [makeTrip()], total: 1 })

    render(<TripsPage />)

    await screen.findByRole("link", { name: /Historic north/ })

    mockedTrip.list.mockRejectedValueOnce(new Error("Network Error"))
    await user.click(screen.getByRole("button", { name: "Refresh" }))

    expect(
      await screen.findByText(/Showing saved trips from just now/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Historic north/ }),
    ).toBeInTheDocument()
    expect(screen.queryByText("Network Error")).not.toBeInTheDocument()
    expect(screen.queryByText("No trips yet")).not.toBeInTheDocument()
  })

  it("reports a failed trip creation without dropping the entered title", async () => {
    const user = userEvent.setup()
    mockedTrip.list.mockResolvedValue({ data: [], total: 0 })
    mockedTrip.create.mockRejectedValue(new Error("start date is in the past"))

    render(<TripsPage />)

    await screen.findByText("No trips yet")
    const input = screen.getByPlaceholderText("Trip title, e.g. Addis weekend")
    await user.type(input, "Broken trip")
    await user.click(screen.getByRole("button", { name: "Create" }))

    expect(
      await screen.findByText("start date is in the past"),
    ).toBeInTheDocument()
    expect(input).toHaveValue("Broken trip")
    expect(
      screen.queryByRole("link", { name: /Broken trip/ }),
    ).not.toBeInTheDocument()
  })
})
