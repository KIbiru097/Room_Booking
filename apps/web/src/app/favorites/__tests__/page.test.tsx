import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import FavoritesPage from "@/app/favorites/page"
import { catalogService } from "@/services/catalog.service"
import type { FavoriteHotel } from "@/lib/types"
import { useAuth } from "@/lib/auth-store"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/favorites",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(""),
}))

jest.mock("@/services/catalog.service", () => ({
  catalogService: {
    getFavorites: jest.fn(),
    searchHotels: jest.fn(),
    getHotelById: jest.fn(),
  },
}))

const mockedCatalog = catalogService as jest.Mocked<typeof catalogService>

function makeHotel(overrides: Partial<FavoriteHotel> = {}): FavoriteHotel {
  return {
    id: "hotel-1",
    name: "Sheraton Addis",
    description: "Luxury stay",
    address: "Bole Road",
    city: { id: "c1", name: "Addis Ababa", country: { name: "Ethiopia" } },
    starRating: 5,
    primaryImageUrl: null,
    minPricePerNight: 4200,
    averageRating: 4.6,
    reviewCount: 128,
    ...overrides,
  }
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={client}>
      <FavoritesPage />
    </QueryClientProvider>,
  )
}

describe("favorites page", () => {
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
    mockedCatalog.getFavorites.mockReset()
  })

  it("shows the collection header and dashboard link while loading", async () => {
    mockedCatalog.getFavorites.mockReturnValue(new Promise(() => undefined))

    const { container } = renderPage()

    expect(
      screen.getByRole("heading", { name: "Saved stays" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Hotels you saved for a future visit."),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Back to dashboard/ }),
    ).toHaveAttribute("href", "/dashboard?tab=wishlist")
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3)
    expect(
      screen.queryByText("Your saved stays are empty"),
    ).not.toBeInTheDocument()
  })

  it("surfaces a load failure with the retry copy", async () => {
    mockedCatalog.getFavorites.mockRejectedValue(new Error("network down"))

    renderPage()

    expect(
      await screen.findByText(
        "Unable to load your saved stays. Please try again.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText("Your saved stays are empty"),
    ).not.toBeInTheDocument()
  })

  it("offers the explore call to action when nothing is saved", async () => {
    mockedCatalog.getFavorites.mockResolvedValue([])

    renderPage()

    expect(
      await screen.findByText("Your saved stays are empty"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Tap the heart on a hotel to keep it here."),
    ).toBeInTheDocument()
    const cta = screen.getByRole("link", { name: /Explore hotels/ })
    expect(cta).toHaveAttribute("href", "/search")
  })

  it("renders a card per saved stay with rating, price and detail link", async () => {
    mockedCatalog.getFavorites.mockResolvedValue([
      makeHotel(),
      makeHotel({
        id: "hotel-2",
        name: "Lalibela Lodge",
        address: "Church Road",
        city: { id: "c2", name: "Lalibela", country: { name: "Ethiopia" } },
        averageRating: null,
        minPricePerNight: 1800,
      }),
    ])

    renderPage()

    const first = await screen.findByRole("heading", { name: "Sheraton Addis" })
    expect(first).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Lalibela Lodge" }),
    ).toBeInTheDocument()

    const cards = screen.getAllByRole("link", {
      name: /Sheraton Addis|Lalibela Lodge/,
    })
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveAttribute("href", "/hotel/hotel-1")
    expect(cards[1]).toHaveAttribute("href", "/hotel/hotel-2")

    expect(screen.getByText("Bole Road, Addis Ababa")).toBeInTheDocument()
    expect(screen.getByText("4.6")).toBeInTheDocument()
    expect(screen.getByText("From 4,200 ETB")).toBeInTheDocument()
    expect(screen.getByText("New")).toBeInTheDocument()
    expect(screen.getByText("From 1,800 ETB")).toBeInTheDocument()

    expect(
      within(cards[0]).getByRole("img", { name: "Sheraton Addis" }),
    ).toBeInTheDocument()
  })

  it("keeps the guest on the page once the query resolves", async () => {
    mockedCatalog.getFavorites.mockResolvedValue([makeHotel()])
    const user = userEvent.setup()

    renderPage()

    const card = await screen.findByRole("heading", { name: "Sheraton Addis" })
    expect(card).toBeInTheDocument()
    await user.click(screen.getByRole("link", { name: /Back to dashboard/ }))
    expect(mockedCatalog.getFavorites).toHaveBeenCalledTimes(1)
  })
})
