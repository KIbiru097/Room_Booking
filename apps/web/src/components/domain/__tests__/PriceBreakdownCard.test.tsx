import { render, screen } from "@testing-library/react"
import { PriceBreakdownCard } from "@/components/domain/PriceBreakdownCard"
import type { BookingQuote, Hotel } from "@/lib/types"

const buildQuote = (overrides: Partial<BookingQuote> = {}): BookingQuote => ({
  hotel: { id: "h-1", name: "Skylight Hotel" },
  checkIn: "2026-01-05",
  checkOut: "2026-01-08",
  nights: 3,
  rooms: [{ roomId: "r-1", roomNumber: "402" }],
  subtotal: 9000,
  taxRate: 0.15,
  taxAmount: 1350,
  serviceFee: 450,
  discount: 500,
  total: 10300,
  couponCode: "LUXSTAY20",
  ...overrides,
})

const buildHotel = (overrides: Partial<Hotel> = {}): Hotel => ({
  id: "h-1",
  name: "Skylight Hotel",
  description: "A luminous stay in the capital.",
  address: "Bole Road, Addis Ababa",
  city: { id: "c-1", name: "Addis Ababa", country: { name: "Ethiopia" } },
  starRating: 5,
  averageRating: 4.8,
  reviewCount: 42,
  status: "ACTIVE",
  lat: 9.01,
  lng: 38.75,
  images: [
    { id: "img-1", url: "/images/secondary.jpg", isPrimary: false },
    { id: "img-2", url: "/images/primary.jpg", isPrimary: true },
  ],
  amenities: [],
  rooms: [],
  createdAt: "2025-12-01T00:00:00.000Z",
  updatedAt: "2025-12-01T00:00:00.000Z",
  ...overrides,
})

const baseProps = {
  checkIn: "2026-01-05",
  checkOut: "2026-01-08",
  guests: { adults: 2, children: 1 },
}

const formatStayDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`))

describe("PriceBreakdownCard", () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it("renders the hotel banner with its primary image and city", () => {
    render(
      <PriceBreakdownCard
        quote={buildQuote()}
        hotel={buildHotel()}
        roomType="DELUXE_SUITE"
        {...baseProps}
      />,
    )

    expect(screen.getByText("Skylight Hotel")).toBeInTheDocument()
    expect(screen.getByText("Addis Ababa, Ethiopia")).toBeInTheDocument()

    const image = screen.getByRole("img", { name: "Skylight Hotel" })
    expect(image.getAttribute("src")).toContain("primary")
    expect(image.getAttribute("src")).not.toContain("secondary")
  })

  it("falls back to the first image when no image is marked primary", () => {
    render(
      <PriceBreakdownCard
        quote={buildQuote()}
        hotel={buildHotel({
          images: [{ id: "img-1", url: "/images/only.jpg", isPrimary: false }],
        })}
        {...baseProps}
      />,
    )

    expect(
      screen.getByRole("img", { name: "Skylight Hotel" }).getAttribute("src"),
    ).toContain("only.jpg")
  })

  it("renders placeholder copy when no hotel is selected", () => {
    render(
      <PriceBreakdownCard quote={buildQuote()} hotel={null} {...baseProps} />,
    )

    expect(screen.getByText("Selected Hotel")).toBeInTheDocument()
    expect(screen.getByText("Ethiopia")).toBeInTheDocument()
    expect(
      screen.getByRole("img", { name: "Luxury Hotel" }).getAttribute("src"),
    ).toContain("Swimming_pool_and_main_building")
  })

  it("summarizes stay dates, guests and suite type", () => {
    render(
      <PriceBreakdownCard
        quote={buildQuote()}
        hotel={buildHotel()}
        roomType="DELUXE_SUITE"
        {...baseProps}
      />,
    )

    expect(screen.getByText("Stay Dates")).toBeInTheDocument()
    expect(
      screen.getByText(
        `${formatStayDate("2026-01-05")} – ${formatStayDate("2026-01-08")} (3 nights)`,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("Guests")).toBeInTheDocument()
    expect(screen.getByText("2 Adults, 1 Child")).toBeInTheDocument()
    expect(screen.getByText("Suite Type")).toBeInTheDocument()
    expect(screen.getByText("DELUXE SUITE")).toBeInTheDocument()
  })

  it("uses the singular date line and single-adult copy", () => {
    render(
      <PriceBreakdownCard
        quote={buildQuote({ nights: 1 })}
        hotel={buildHotel()}
        checkIn="2026-01-05"
        checkOut="2026-01-06"
        guests={{ adults: 1, children: 0 }}
      />,
    )

    expect(
      screen.getByText(
        `${formatStayDate("2026-01-05")} – ${formatStayDate("2026-01-06")} (1 night)`,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("1 Adult")).toBeInTheDocument()
    expect(screen.queryByText(/Children/)).not.toBeInTheDocument()
    expect(screen.queryByText("Suite Type")).not.toBeInTheDocument()
  })

  it("itemizes subtotal, taxes, fees, discount and the authoritative total", () => {
    render(
      <PriceBreakdownCard
        quote={buildQuote()}
        hotel={buildHotel()}
        roomType="DELUXE_SUITE"
        {...baseProps}
      />,
    )

    expect(screen.getByText("Room Subtotal")).toBeInTheDocument()
    expect(screen.getByText("ETB 9,000")).toBeInTheDocument()
    expect(screen.getByText("Value Added Tax (15%)")).toBeInTheDocument()
    expect(screen.getByText("ETB 1,350")).toBeInTheDocument()
    expect(screen.getByText("Hotel Hospitality Fee (5%)")).toBeInTheDocument()
    expect(screen.getByText("ETB 450")).toBeInTheDocument()
    expect(screen.getByText("LUXSTAY20")).toBeInTheDocument()
    expect(screen.getByText("-ETB 500")).toBeInTheDocument()
    expect(screen.getByText("Total Price")).toBeInTheDocument()
    expect(screen.getByText("Taxes & fees included")).toBeInTheDocument()
    expect(screen.getByText("ETB 10,300")).toBeInTheDocument()
  })

  it("rounds the tax rate shown on the tax line", () => {
    render(
      <PriceBreakdownCard
        quote={buildQuote({ taxRate: 0.087 })}
        hotel={buildHotel()}
        {...baseProps}
      />,
    )

    expect(screen.getByText("Value Added Tax (9%)")).toBeInTheDocument()
  })

  it("labels an un-couponed discount as a promotion", () => {
    render(
      <PriceBreakdownCard
        quote={buildQuote({ couponCode: undefined })}
        hotel={buildHotel()}
        {...baseProps}
      />,
    )

    expect(screen.getByText("Promotion")).toBeInTheDocument()
    expect(screen.getByText("-ETB 500")).toBeInTheDocument()
  })

  it("hides tax, fee and discount rows when a quote reports only a subtotal", () => {
    render(
      <PriceBreakdownCard
        quote={buildQuote({
          nights: 1,
          taxRate: undefined,
          taxAmount: undefined,
          serviceFee: undefined,
          discount: 0,
          couponCode: undefined,
          subtotal: 1200,
          total: 1200,
        })}
        hotel={buildHotel()}
        {...baseProps}
      />,
    )

    expect(screen.getAllByText("ETB 1,200")).toHaveLength(2)
    expect(screen.queryByText(/Value Added Tax/)).not.toBeInTheDocument()
    expect(
      screen.queryByText("Hotel Hospitality Fee (5%)"),
    ).not.toBeInTheDocument()
    expect(screen.queryByText("Promotion")).not.toBeInTheDocument()
    expect(screen.queryByText("-ETB 500")).not.toBeInTheDocument()
  })

  it("renders zeroed money lines when no quote is available yet", () => {
    render(<PriceBreakdownCard quote={null} hotel={null} {...baseProps} />)

    expect(screen.getAllByText("ETB 0")).toHaveLength(2)
    expect(
      screen.getByText(
        `${formatStayDate("2026-01-05")} – ${formatStayDate("2026-01-08")} (1 night)`,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("Total Price")).toBeInTheDocument()
    expect(
      screen.getByText("Guaranteed booking with 256-bit encrypted checkout."),
    ).toBeInTheDocument()
  })

  it("replaces the financial rows with a skeleton while loading", () => {
    const { container } = render(
      <PriceBreakdownCard quote={null} hotel={null} isLoading {...baseProps} />,
    )

    expect(container.querySelector(".animate-pulse")).not.toBeNull()
    expect(screen.queryByText("Room Subtotal")).not.toBeInTheDocument()
    expect(screen.queryByText("Total Price")).not.toBeInTheDocument()
    expect(screen.getByText("Stay Dates")).toBeInTheDocument()
  })

  it("shows a placeholder for an empty date and keeps unparseable dates verbatim", () => {
    const { rerender } = render(
      <PriceBreakdownCard
        quote={buildQuote()}
        hotel={buildHotel()}
        {...baseProps}
        checkIn=""
      />,
    )

    expect(screen.getByText(/— – .+ \(3 nights\)/)).toBeInTheDocument()

    rerender(
      <PriceBreakdownCard
        quote={buildQuote({ checkIn: "not-a-date" })}
        hotel={buildHotel()}
        {...baseProps}
        checkIn="not-a-date"
      />,
    )

    expect(screen.getByText(/not-a-date – .+ \(3 nights\)/)).toBeInTheDocument()
  })
})
