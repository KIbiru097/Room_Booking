import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import HomePage from "@/app/page"
import {
  useHotelSearchQuery,
  useFavoritesQuery,
  useToggleFavoriteMutation,
} from "@/hooks/use-catalog"
import { useAuth } from "@/lib/auth-store"
import { useToastStore } from "@/components/ui/Toast"
import type { HotelSummary } from "@/lib/types"

jest.mock("@/app/HeroAnimated", () => ({
  __esModule: true,
  default: () => <div data-testid="hero-animated" />,
}))

jest.mock("@/hooks/use-catalog", () => ({
  useHotelSearchQuery: jest.fn(),
  useFavoritesQuery: jest.fn(),
  useToggleFavoriteMutation: jest.fn(),
}))

const mockSearch = useHotelSearchQuery as jest.Mock
const mockFavorites = useFavoritesQuery as jest.Mock
const mockToggle = useToggleFavoriteMutation as jest.Mock

const hotel = (
  overrides: Partial<HotelSummary> & { id: string ;name: string },
): HotelSummary => ({
  description: "A lovely stay",
  address: "12 Bole Road",
  city: { id: "c1", name: "Addis Ababa", country: { name: "Ethiopia" } },
  starRating: 5,
  primaryImageUrl: null,
  minPricePerNight: 4200,
  averageRating: 4.8,
  reviewCount: 32,
  amenities: ["Wi-Fi", "Pool", "Spa", "Gym"],
  ...overrides,
})

function renderHome() {
  return render(<HomePage />)
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
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
  useToastStore.setState({ toasts: [] })
  mockFavorites.mockReturnValue({ data: [], isLoading: false, isError: false })
  mockToggle.mockReturnValue({ mutate: jest.fn(), isPending: false })
})

describe("home page", () => {
  it("renders the hero, featured, destination, and testimonial sections", () => {
    mockSearch.mockReturnValue({
      data: { data: [hotel({ id: "h1", name: "Sheraton Addis" })] },
      isLoading: false,
      isError: false,
    })

    renderHome()

    expect(screen.getByTestId("hero-animated")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Featured Luxury Stays" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Explore All Properties/ }),
    ).toHaveAttribute("href", "/search")
    expect(
      screen.getByRole("heading", { name: "Signature Destinations" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Addis Ababa" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", {
        name: "Stories from Our Distinguished Guests",
      }),
    ).toBeInTheDocument()
    expect(screen.getByText("Eleanor Vance")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Explore All Suites & Resorts/ }),
    ).toBeInTheDocument()
  })

  it("shows loading skeletons while the search query is in flight", () => {
    mockSearch.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    const { container } = renderHome()

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    )
    expect(screen.queryByText("Properties coming soon")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: /Sheraton Addis/ }),
    ).not.toBeInTheDocument()
  })

  it("renders each returned hotel with a link to its detail page", () => {
    mockSearch.mockReturnValue({
      data: {
        data: [
          hotel({ id: "h1", name: "Sheraton Addis" }),
          hotel({
            id: "h2",
            name: "Capital Hotel",
            starRating: 4,
            reviewCount: 7,
            amenities: ["Concierge"],
          }),
        ],
      },
      isLoading: false,
      isError: false,
    })

    renderHome()

    expect(
      screen.getByRole("heading", { name: "Sheraton Addis" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Capital Hotel" }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole("article")).toHaveLength(2)
    expect(
      screen.getByRole("heading", { name: "Sheraton Addis" }).closest("a"),
    ).toHaveAttribute("href", "/hotel/h1")
    expect(screen.getByText("5 Stars")).toBeInTheDocument()
    expect(screen.getByText("4 Stars")).toBeInTheDocument()
    expect(screen.getByText("32 verified reviews")).toBeInTheDocument()
    expect(screen.getByText("7 verified reviews")).toBeInTheDocument()
    expect(screen.getByText("Wi-Fi")).toBeInTheDocument()
  })

  it("marks favorites returned by the favorites query on the matching card", () => {
    mockSearch.mockReturnValue({
      data: {
        data: [
          hotel({ id: "h1", name: "Sheraton Addis" }),
          hotel({ id: "h2", name: "Capital Hotel" }),
        ],
      },
      isLoading: false,
      isError: false,
    })
    mockFavorites.mockReturnValue({
      data: [{ id: "h2" }],
      isLoading: false,
      isError: false,
    })

    renderHome()

    expect(
      screen.getByRole("button", {
        name: "Remove Capital Hotel from favorites",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Save Sheraton Addis to favorites" }),
    ).toBeInTheDocument()
  })

  it("asks signed-out visitors to sign in before saving a favorite", async () => {
    const user = userEvent.setup()
    const mutate = jest.fn()
    mockToggle.mockReturnValue({ mutate, isPending: false })
    mockSearch.mockReturnValue({
      data: { data: [hotel({ id: "h1", name: "Sheraton Addis" })] },
      isLoading: false,
      isError: false,
    })

    renderHome()
    await user.click(
      screen.getByRole("button", { name: "Save Sheraton Addis to favorites" }),
    )

    expect(mutate).not.toHaveBeenCalled()
    expect(useToastStore.getState().toasts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "info",
          title: "Sign in required",
          message: "Please sign in to save properties to your wishlist.",
        }),
      ]),
    )
  })

  it("toggles the favorite mutation for a signed-in guest", async () => {
    const user = userEvent.setup()
    const mutate = jest.fn()
    mockToggle.mockReturnValue({ mutate, isPending: false })
    mockSearch.mockReturnValue({
      data: { data: [hotel({ id: "h1", name: "Sheraton Addis" })] },
      isLoading: false,
      isError: false,
    })
    useAuth.getState().setSession({
      user: {
        id: "u1",
        email: "guest@example.com",
        fullName: "Guest One",
        role: "CUSTOMER",
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    })

    renderHome()
    await user.click(
      screen.getByRole("button", { name: "Save Sheraton Addis to favorites" }),
    )

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

  it("shows the empty state when the catalog returns no hotels", () => {
    mockSearch.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
    })

    renderHome()

    expect(screen.getByText("Properties coming soon")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Our curators are verifying new luxury properties. Check back shortly or search our full global catalog.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Search Global Catalog" }),
    ).toBeInTheDocument()
    expect(screen.queryByText("Saved to favorites")).not.toBeInTheDocument()
  })

  it("hides the empty state when the search query fails", () => {
    mockSearch.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    renderHome()

    expect(screen.queryByText("Properties coming soon")).not.toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Featured Luxury Stays" }),
    ).toBeInTheDocument()
  })

  it("keeps destinations and value props visible regardless of query state", () => {
    mockSearch.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    const { container } = renderHome()

    const destinations = screen
      .getByRole("heading", { name: "Signature Destinations" })
      .closest("section")
    expect(destinations).toBeTruthy()
    expect(
      within(container).getAllByText(
        /Luxury Properties|Grand Resorts|Boutique Stays|Cliffside Villas/,
      ),
    ).toHaveLength(4)
    expect(screen.getByText("Curated Five-Star Stays")).toBeInTheDocument()
    expect(
      screen.getByText("Authoritative Reservation Hold"),
    ).toBeInTheDocument()
  })
})
