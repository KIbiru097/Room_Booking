import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SearchPage from "@/app/search/page"
import {
  useAmenitiesQuery,
  useFavoritesQuery,
  useHotelSearchQuery,
  useToggleFavoriteMutation,
} from "@/hooks/use-catalog"
import type { HotelSummary } from "@/lib/types"

let mockParams = ""
const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => mockPush(...args),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/search",
  useSearchParams: () => new URLSearchParams(mockParams),
}))

jest.mock("@/hooks/use-catalog", () => ({
  useFavoritesQuery: jest.fn(),
  useHotelSearchQuery: jest.fn(),
  useAmenitiesQuery: jest.fn(),
  useToggleFavoriteMutation: jest.fn(),
}))

const mockedSearch =
  useHotelSearchQuery as jest.MockedFunction<typeof useHotelSearchQuery>
const mockedFavorites =
  useFavoritesQuery as jest.MockedFunction<typeof useFavoritesQuery>
const mockedAmenities =
  useAmenitiesQuery as jest.MockedFunction<typeof useAmenitiesQuery>
const mockedToggleFavorite =
  useToggleFavoriteMutation as jest.MockedFunction<typeof useToggleFavoriteMutation>

const refetch = jest.fn()
const mutate = jest.fn()

function makeHotel(overrides: Partial<HotelSummary> = {}): HotelSummary {
  return {
    id: "h1",
    name: "Sheraton Addis",
    description: "Luxury stay",
    address: "Bole Road",
    city: { id: "c1", name: "Addis Ababa", country: { name: "Ethiopia" } },
    starRating: 5,
    primaryImageUrl: null,
    minPricePerNight: 1000,
    averageRating: 4.7,
    reviewCount: 42,
    amenities: ["Pool", "Spa"],
    ...overrides,
  }
}

function setSearchState(
  overrides: Partial<{
    data: { data: HotelSummary[] ;meta: { total: number } } | undefined
    isLoading: boolean
    isError: boolean
    error: Error | null
  }> = {},
) {
  mockedSearch.mockReturnValue({
    data: { data: [makeHotel()], meta: { total: 1 } },
    isLoading: false,
    isError: false,
    error: null,
    refetch,
    ...overrides,
  } as never)
}

describe("search page", () => {
  beforeEach(() => {
    mockParams = ""
    mockPush.mockClear()
    refetch.mockClear()
    mockedSearch.mockReset()
    mockedFavorites.mockReset()
    mockedAmenities.mockReset()
    mockedToggleFavorite.mockReset()
    mockedFavorites.mockReturnValue({ data: [] } as never)
    mockedAmenities.mockReturnValue({ data: undefined } as never)
    mutate.mockClear()
    mockedToggleFavorite.mockReturnValue({ mutate } as never)
    setSearchState()
  })

  it("shows the discovery header and skeletons while the catalog loads", () => {
    setSearchState({ isLoading: true, data: undefined })

    const { container } = render(<SearchPage />)

    expect(screen.getByText("Discovery Catalog")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", {
        name: "Explore Luxury Stays & Grand Resorts",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Searching authoritative property inventory..."),
    ).toBeInTheDocument()
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(30)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("renders the result count and a card per property", () => {
    setSearchState({
      data: {
        data: [
          makeHotel(),
          makeHotel({
            id: "h2",
            name: "Lalibela Lodge",
            minPricePerNight: 650,
          }),
        ],
        meta: { total: 2 },
      },
    })

    render(<SearchPage />)

    expect(
      screen.getByText("Found 2 verified luxury properties"),
    ).toBeInTheDocument()
    const cards = screen.getAllByRole("article")
    expect(cards).toHaveLength(2)
    expect(
      screen.getByRole("heading", { name: "Sheraton Addis" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Lalibela Lodge" }),
    ).toBeInTheDocument()
    expect(screen.getAllByText("Addis Ababa, Ethiopia")).toHaveLength(2)
    expect(screen.getByText("ETB 1,000")).toBeInTheDocument()
    expect(screen.getAllByText("View Suites")).toHaveLength(2)
    expect(
      screen.getAllByRole("button", {
        name: /Save Sheraton Addis to favorites/,
      }),
    ).toHaveLength(1)
  })

  it("offers the clear-filters action when nothing matches", () => {
    setSearchState({ data: { data: [], meta: { total: 0 } } })

    render(<SearchPage />)

    expect(screen.getByText("No luxury properties found")).toBeInTheDocument()
    expect(
      screen.getByText(/No properties match your exact search criteria/),
    ).toBeInTheDocument()
    screen.getByRole("button", { name: "Clear Filters" }).click()
    expect(mockPush).toHaveBeenCalledWith("/search")
  })

  it("surfaces a catalog failure with a retry that refetches", async () => {
    const user = userEvent.setup()
    setSearchState({
      data: undefined,
      isError: true,
      error: new Error("gateway timeout"),
    })

    render(<SearchPage />)

    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Unable to load hotel catalog")
    expect(alert).toHaveTextContent("gateway timeout")

    await user.click(screen.getByRole("button", { name: /Try Again/ }))
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(
      screen.queryByText("No luxury properties found"),
    ).not.toBeInTheDocument()
  })

  it("reads the city from the URL and reports it in the header and chip", () => {
    mockParams = "city=Addis Ababa"
    setSearchState()

    render(<SearchPage />)

    expect(
      screen.getByRole("heading", { name: "Luxury Stays in Addis Ababa" }),
    ).toBeInTheDocument()
    expect(screen.getByText("City: Addis Ababa")).toBeInTheDocument()
    expect(screen.getByText("Active filters:")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Filters (1)" }),
    ).toBeInTheDocument()
    expect(mockedSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({ city: "Addis Ababa" }),
    )
  })

  it("writes the star rating filter into the URL", async () => {
    const user = userEvent.setup()
    render(<SearchPage />)

    await user.click(
      screen.getByRole("checkbox", { name: "5-Star Grand Luxury" }),
    )
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/search?stars=5"),
    )
  })

  it("toggles the amenity filter through the fallback amenity list", async () => {
    const user = userEvent.setup()
    render(<SearchPage />)

    await user.click(screen.getByRole("checkbox", { name: "Pool" }))
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/search?amenities=Pool"),
    )
  })

  it("applies the sort selection", async () => {
    const user = userEvent.setup()
    render(<SearchPage />)

    await user.selectOptions(screen.getByRole("combobox"), "price_asc")
    expect(mockPush).toHaveBeenCalledWith("/search?sort=price_asc")
  })

  it("applies the typed city when the traveller presses enter", async () => {
    const user = userEvent.setup()
    render(<SearchPage />)

    const input = document.getElementById(
      "search-city-filter",
    ) as HTMLInputElement
    await user.clear(input)
    await user.type(input, "Lalibela{Enter}")
    expect(mockPush).toHaveBeenCalledWith("/search?city=Lalibela")
  })

  it("applies the nightly rate ceiling from the price slider", async () => {
    mockParams = "minPrice=500&maxPrice=20000"
    setSearchState()
    render(<SearchPage />)

    const slider = screen.getByLabelText("Maximum price per night")
    expect(slider).toHaveValue("20000")
    expect(screen.getByText("ETB 500 – ETB 20,000")).toBeInTheDocument()

    fireEvent.change(slider, { target: { value: "5000" } })

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        "/search?minPrice=500&maxPrice=5000",
      ),
    )
    expect(
      screen.getByRole("button", { name: "Filters (1)" }),
    ).toBeInTheDocument()
  })

  it("removes individual filter chips and resets everything", async () => {
    const user = userEvent.setup()
    mockParams = "city=Lalibela&stars=4"
    setSearchState()

    render(<SearchPage />)

    expect(screen.getByText("City: Lalibela")).toBeInTheDocument()
    expect(screen.getByText("4 Stars")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Filters (2)" }),
    ).toBeInTheDocument()

    const chips = screen.getByText("Active filters:")
      .parentElement as HTMLElement
    const chipButtons = within(chips).getAllByRole("button")
    await user.click(chipButtons[0])
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/search?stars=4"),
    )

    mockPush.mockClear()
    await user.click(screen.getByRole("button", { name: "Reset All" }))
    expect(mockPush).toHaveBeenCalledWith("/search")
  })

  it("opens the mobile filter drawer and closes it again", async () => {
    const user = userEvent.setup()
    setSearchState({ data: { data: [makeHotel()], meta: { total: 7 } } })
    render(<SearchPage />)

    await user.click(screen.getByRole("button", { name: "Filters" }))
    const dialog = screen.getByRole("dialog", { hidden: true })
    expect(within(dialog).getAllByText("Filter Stays").length).toBeGreaterThan(
      0,
    )
    expect(
      within(dialog).getByRole("button", { name: "Show 7 Properties" }),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByPlaceholderText("Filter by city..."),
    ).toBeInTheDocument()

    await user.click(
      within(dialog).getByRole("button", { name: "Close drawer" }),
    )
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("totals the stay when check-in and check-out dates are supplied", () => {
    mockParams = "checkIn=2026-12-01&checkOut=2026-12-03"
    setSearchState()

    render(<SearchPage />)

    expect(screen.getByText("Total for 2 nights")).toBeInTheDocument()
    expect(screen.getByText("ETB 2,000")).toBeInTheDocument()
    expect(screen.getByText("(ETB 1,000/nt)")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "View Suites" })).toHaveAttribute(
      "href",
      "/hotel/h1?checkIn=2026-12-01&checkOut=2026-12-03",
    )
  })

  it("passes the active favorites through to the card heart state", () => {
    mockedFavorites.mockReturnValue({ data: [makeHotel()] } as never)
    setSearchState()

    render(<SearchPage />)

    expect(
      screen.getByRole("button", {
        name: "Remove Sheraton Addis from favorites",
      }),
    ).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })
})
