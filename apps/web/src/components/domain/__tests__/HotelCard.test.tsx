import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HotelCard } from "@/components/domain/HotelCard"
import { useAuth } from "@/lib/auth-store"
import { toast } from "@/components/ui/Toast"
import type { HotelSummary } from "@/lib/types"

jest.mock("@/components/ui/Toast", () => ({
  toast: {
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

const mockMutate = jest.fn()

jest.mock("@/hooks/use-catalog", () => ({
  useToggleFavoriteMutation: () => ({ mutate: mockMutate }),
}))

const mockedToast =
  toast as unknown as Record<"success" | "warning" | "error" | "info", jest.Mock>

const buildHotel = (overrides: Partial<HotelSummary> = {}): HotelSummary => ({
  id: "h-1",
  name: "Skylight Hotel",
  description: "A luminous stay in the capital.",
  address: "Bole Road, Addis Ababa",
  city: { id: "c-1", name: "Addis Ababa", country: { name: "Ethiopia" } },
  starRating: 4,
  primaryImageUrl: "/images/skylight.jpg",
  minPricePerNight: 2500,
  averageRating: 4.6,
  reviewCount: 128,
  amenities: ["Free Wi-Fi", "Outdoor Pool", "Spa", "Airport Shuttle", "Gym"],
  ...overrides,
})

describe("HotelCard", () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
    useAuth.setState({ user: null })
  })

  it("renders the hotel name, location, star rating and review summary", () => {
    render(<HotelCard hotel={buildHotel()} />)

    expect(
      screen.getByRole("heading", { name: "Skylight Hotel" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Addis Ababa, Ethiopia")).toBeInTheDocument()
    expect(screen.getByText("4 Stars")).toBeInTheDocument()
    expect(screen.getByText("4.6")).toBeInTheDocument()
    expect(screen.getByText("128 verified reviews")).toBeInTheDocument()
  })

  it("falls back to a New badge and awaiting reviews when ratings are absent", () => {
    render(
      <HotelCard hotel={buildHotel({ averageRating: null, reviewCount: 0 })} />,
    )

    expect(screen.getByText("New")).toBeInTheDocument()
    expect(screen.getByText("Awaiting reviews")).toBeInTheDocument()
    expect(screen.queryByText("verified reviews")).not.toBeInTheDocument()
  })

  it("renders the nightly rate for a single night stay", () => {
    render(<HotelCard hotel={buildHotel()} />)

    expect(screen.getByText("Starting nightly rate")).toBeInTheDocument()
    expect(screen.getByText("ETB 2,500")).toBeInTheDocument()
    expect(screen.getByText("/ night")).toBeInTheDocument()
    expect(screen.queryByText(/Total for/)).not.toBeInTheDocument()
  })

  it("multiplies the nightly rate across multiple nights", () => {
    render(<HotelCard hotel={buildHotel()} stayNights={3} />)

    expect(screen.getByText("Total for 3 nights")).toBeInTheDocument()
    expect(screen.getByText("ETB 7,500")).toBeInTheDocument()
    expect(screen.getByText("(ETB 2,500/nt)")).toBeInTheDocument()
    expect(screen.queryByText("Starting nightly rate")).not.toBeInTheDocument()
  })

  it("asks the guest to contact the concierge when no nightly price is available", () => {
    render(<HotelCard hotel={buildHotel({ minPricePerNight: null })} />)

    expect(screen.getByText("Contact for rate")).toBeInTheDocument()
    expect(screen.queryByText("/ night")).not.toBeInTheDocument()
    expect(screen.queryByText(/ETB/)).not.toBeInTheDocument()
  })

  it("links the image, title and call to action to the hotel detail page", () => {
    render(<HotelCard hotel={buildHotel()} />)

    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(3)
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/hotel/h-1")
    }
    expect(
      screen.getByRole("link", { name: "View Suites" }),
    ).toBeInTheDocument()
  })

  it("appends the search query to the detail link", () => {
    render(<HotelCard hotel={buildHotel()} searchQuery="city=addis&page=2" />)

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("href", "/hotel/h-1?city=addis&page=2")
    }
  })

  it("renders at most three amenity chips with an overflow counter", () => {
    render(<HotelCard hotel={buildHotel()} />)

    expect(screen.getByText("Free Wi-Fi")).toBeInTheDocument()
    expect(screen.getByText("Outdoor Pool")).toBeInTheDocument()
    expect(screen.getByText("Spa")).toBeInTheDocument()
    expect(screen.queryByText("Airport Shuttle")).not.toBeInTheDocument()
    expect(screen.getByText("+2")).toBeInTheDocument()
  })

  it("omits the amenity chips entirely when the hotel lists none", () => {
    render(<HotelCard hotel={buildHotel({ amenities: [] })} />)

    expect(screen.queryByText("+2")).not.toBeInTheDocument()
    expect(screen.queryByText("Free Wi-Fi")).not.toBeInTheDocument()
  })

  it("asks a signed-out guest to sign in before favouriting", async () => {
    const user = userEvent.setup()
    render(<HotelCard hotel={buildHotel()} />)

    const heart = screen.getByRole("button", {
      name: "Save Skylight Hotel to favorites",
    })
    await user.click(heart)

    expect(mockedToast.info).toHaveBeenCalledWith(
      "Sign in required",
      "Please sign in to save properties to your wishlist.",
    )
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it("mutates the favorite and confirms for a signed-in guest", async () => {
    const user = userEvent.setup()
    useAuth.setState({
      user: {
        id: "u-1",
        email: "ada@luxstay.test",
        fullName: "Ada Worku",
        role: "CUSTOMER",
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    })
    render(<HotelCard hotel={buildHotel()} />)

    await user.click(
      screen.getByRole("button", { name: "Save Skylight Hotel to favorites" }),
    )

    expect(mockMutate).toHaveBeenCalledWith({
      hotelId: "h-1",
      isFavorite: false,
    })
    expect(mockedToast.success).toHaveBeenCalledWith(
      "Saved to favorites",
      "Skylight Hotel updated.",
    )
  })

  it("offers removal and reports removal for an already-saved hotel", async () => {
    const user = userEvent.setup()
    useAuth.setState({
      user: {
        id: "u-1",
        email: "ada@luxstay.test",
        fullName: "Ada Worku",
        role: "CUSTOMER",
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    })
    render(<HotelCard hotel={buildHotel()} isFavorite />)

    const heart = screen.getByRole("button", {
      name: "Remove Skylight Hotel from favorites",
    })
    expect(heart.querySelector("svg")).toHaveClass("fill-red-500")

    await user.click(heart)

    expect(mockMutate).toHaveBeenCalledWith({
      hotelId: "h-1",
      isFavorite: true,
    })
    expect(mockedToast.success).toHaveBeenCalledWith(
      "Removed from favorites",
      "Skylight Hotel updated.",
    )
  })

  it("uses the fallback image when the hotel has no photo", () => {
    render(<HotelCard hotel={buildHotel({ primaryImageUrl: null })} />)

    const image = screen.getByRole("img", { name: "Skylight Hotel" })
    expect(image.getAttribute("src")).toContain("hotel-fallback")
  })

  it("swaps to the fallback image after a loading error", () => {
    render(<HotelCard hotel={buildHotel()} />)

    const image = screen.getByRole("img", { name: "Skylight Hotel" })
    expect(image.getAttribute("src")).toContain("skylight")

    fireEvent.error(image)

    expect(
      screen.getByRole("img", { name: "Skylight Hotel" }).getAttribute("src"),
    ).toContain("hotel-fallback")
  })
})
