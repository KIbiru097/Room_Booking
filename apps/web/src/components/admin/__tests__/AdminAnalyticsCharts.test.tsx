import { render, screen, fireEvent, within } from "@testing-library/react"
import {
  AdminAnalyticsCharts,
  type TopHotelPoint,
  type OccupancyBreakdownPoint,
} from "@/components/admin/AdminAnalyticsCharts"

const monthlyRevenue = Array.from({ length: 12 }, (_, index) => ({
  month: `2025-${String(index + 1).padStart(2, "0")}`,
  revenue: (index + 1) * 1000,
}))

const bookingTrends = [
  { date: "2025-06-01", bookings: 0 },
  { date: "2025-06-02", bookings: 1 },
  { date: "2025-06-03", bookings: 2 },
  { date: "2025-06-04", bookings: 4 },
]

const topHotels: TopHotelPoint[] = [
  { hotelId: "h1", name: "Sheraton Addis", bookings: 12 },
  { hotelId: "h2", name: "Hyatt Regency", bookings: 8 },
  { hotelId: "h3", name: "Radisson Blu", bookings: 1 },
  { hotelId: "h4", name: "Capital Hotel", bookings: 5 },
  { hotelId: "h5", name: "Skylight Hotel", bookings: 3 },
  { hotelId: "h6", name: "forgot hotel", bookings: 2 },
]

const occupancyBreakdown: OccupancyBreakdownPoint[] = [
  {
    hotelId: "h1",
    name: "Sheraton Addis",
    totalRooms: 12,
    occupiedToday: 9,
    occupancyRate: 0.75,
  },
  {
    hotelId: "h2",
    name: "Hyatt Regency",
    totalRooms: 20,
    occupiedToday: 9,
    occupancyRate: 0.45,
  },
  {
    hotelId: "h3",
    name: "Radisson Blu",
    totalRooms: 10,
    occupiedToday: 2,
    occupancyRate: 0.2,
  },
]

const shortMonth = (year: number, monthIndex: number) =>
  new Intl.DateTimeFormat(undefined, { month: "short" }).format(
    new Date(year, monthIndex, 1),
  )

const longMonth = (year: number, monthIndex: number) =>
  new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(
    new Date(year, monthIndex, 1),
  )

const shortDate = (year: number, monthIndex: number, day: number) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
    new Date(year, monthIndex, day),
  )

const renderCharts = (
  overrides: Partial<Parameters<typeof AdminAnalyticsCharts>[0]> = {},
) =>
  render(
    <AdminAnalyticsCharts
      monthlyRevenue={monthlyRevenue}
      bookingTrends={bookingTrends}
      topHotels={topHotels}
      occupancyBreakdown={occupancyBreakdown}
      {...overrides}
    />,
  )

const getRevenueHits = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<SVGRectElement>(
      'svg rect[class="cursor-pointer"]',
    ),
  )

const getBookingBars = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('div[style*="height"]'))

const getOccupancyBars = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("div")).filter((el) =>
    /bg-(emerald-600|blue-600|amber-500)/.test(el.className),
  )

describe("AdminAnalyticsCharts", () => {
  it("renders the trends header and starts on the revenue tab", () => {
    const { container } = renderCharts()

    expect(screen.getByText("Platform Performance Trends")).toBeInTheDocument()
    expect(screen.getByText("Live Analytics")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Historical revenue curves, reservation pacing, and property-level occupancy distributions.",
      ),
    ).toBeInTheDocument()

    const revenueTab = screen.getByRole("button", { name: "Revenue Velocity" })
    const bookingsTab = screen.getByRole("button", {
      name: "30-Day Reservations",
    })
    expect(revenueTab.className).toContain("bg-white")
    expect(bookingsTab.className).not.toContain("bg-white")

    expect(screen.getByText("Period Total Revenue")).toBeInTheDocument()
    expect(getRevenueHits(container)).toHaveLength(12)
    expect(screen.getByRole("button", { name: "12M" }).className).toContain(
      "bg-[#0b1528]",
    )
  })

  it("summarises revenue KPIs for the default 12 month window", () => {
    renderCharts()

    expect(screen.getByText("ETB 78,000")).toBeInTheDocument()
    expect(screen.getByText("Across 12 recorded months")).toBeInTheDocument()
    expect(screen.getByText("ETB 6,500")).toBeInTheDocument()
    expect(screen.getByText("Settled guest transactions")).toBeInTheDocument()

    const peakCard = screen.getByText("Peak Performance Month")
      .parentElement as HTMLElement
    expect(within(peakCard).getByText("ETB 12,000")).toBeInTheDocument()
    expect(
      screen.getByText("Highest recorded monthly gross"),
    ).toBeInTheDocument()

    expect(screen.getByText(shortMonth(2025, 0))).toBeInTheDocument()
    expect(screen.getByText(shortMonth(2025, 11))).toBeInTheDocument()
  })

  it("narrows the revenue window to 6 months", () => {
    const { container } = renderCharts()

    fireEvent.click(screen.getByRole("button", { name: "6M" }))

    expect(getRevenueHits(container)).toHaveLength(6)
    expect(screen.getByText("ETB 57,000")).toBeInTheDocument()
    expect(screen.getByText("Across 6 recorded months")).toBeInTheDocument()
    expect(screen.getByText("ETB 9,500")).toBeInTheDocument()
    expect(screen.queryByText(shortMonth(2025, 0))).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "6M" }).className).toContain(
      "bg-[#0b1528]",
    )

    fireEvent.click(screen.getByRole("button", { name: "12M" }))
    expect(getRevenueHits(container)).toHaveLength(12)
  })

  it("shows a revenue tooltip for the hovered month", () => {
    const { container } = renderCharts()
    const hits = getRevenueHits(container)
    const juneHit = hits[5]

    expect(
      screen.queryByText("Total Platform Settled Revenue"),
    ).not.toBeInTheDocument()

    fireEvent.mouseOver(juneHit)

    const tooltip = screen.getByText("Total Platform Settled Revenue")
      .parentElement as HTMLElement
    expect(within(tooltip).getByText(longMonth(2025, 5))).toBeInTheDocument()
    expect(within(tooltip).getByText("ETB 6,000")).toBeInTheDocument()

    fireEvent.mouseOut(juneHit)
    expect(
      screen.queryByText("Total Platform Settled Revenue"),
    ).not.toBeInTheDocument()
  })

  it("switches to the 30 day reservations tab", () => {
    const { container } = renderCharts()

    fireEvent.click(screen.getByRole("button", { name: "30-Day Reservations" }))

    expect(screen.queryByText("Period Total Revenue")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "6M" })).not.toBeInTheDocument()
    expect(
      screen.getByText(
        "Daily reservation pacing over the last 30 calendar days (7 bookings recorded).",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("Peak: 5 bookings / day")).toBeInTheDocument()

    const bars = getBookingBars(container)
    expect(bars).toHaveLength(4)

    expect(screen.getByText(shortDate(2025, 5, 1))).toBeInTheDocument()
    expect(screen.getByText("15 Days Ago")).toBeInTheDocument()
    expect(
      screen.getByText(`Today (${shortDate(2025, 5, 4)})`),
    ).toBeInTheDocument()
  })

  it("shows reservation tooltips on the booking bars", () => {
    const { container } = renderCharts()
    fireEvent.click(screen.getByRole("button", { name: "30-Day Reservations" }))

    const bars = getBookingBars(container)

    fireEvent.mouseOver(bars[1].parentElement as Element)
    expect(screen.getByText("1 reservation")).toBeInTheDocument()
    fireEvent.mouseOut(bars[1].parentElement as Element)

    fireEvent.mouseOver(bars[3].parentElement as Element)
    expect(screen.getByText("4 reservations")).toBeInTheDocument()
    expect(screen.getByText(shortDate(2025, 5, 4))).toBeInTheDocument()
  })

  it("ranks the top properties with booking counts", () => {
    renderCharts()

    expect(screen.getByText("Top Properties by Volume")).toBeInTheDocument()
    expect(screen.getByText("Ranked by Stays")).toBeInTheDocument()

    const topCard = screen
      .getByText("Top Properties by Volume")
      .closest("div.bg-white") as HTMLElement

    expect(within(topCard).getByText("Sheraton Addis")).toBeInTheDocument()
    expect(within(topCard).getByText("12 bookings")).toBeInTheDocument()
    expect(within(topCard).getByText("Radisson Blu")).toBeInTheDocument()
    expect(within(topCard).getByText("1 booking")).toBeInTheDocument()
    expect(within(topCard).getByText("Skylight Hotel")).toBeInTheDocument()
    expect(within(topCard).queryByText("forgot hotel")).not.toBeInTheDocument()
    expect(within(topCard).getByText("1")).toBeInTheDocument()

    const firstRow = within(topCard)
      .getByText("Sheraton Addis")
      .closest("div.space-y-1\\.5") as HTMLElement
    const widthBar = firstRow.querySelector(
      'div[style*="width"]',
    ) as HTMLElement
    expect(widthBar.style.width).toBe("100%")
  })

  it("shows an empty state when no property has bookings", () => {
    renderCharts({ topHotels: [] })

    expect(
      screen.getByText("No property reservations recorded yet."),
    ).toBeInTheDocument()
    expect(screen.queryByText("Ranked by Stays")).toBeInTheDocument()
  })

  it("colors the occupancy bars by rate band", () => {
    const { container } = renderCharts()

    expect(screen.getByText("Hotel Occupancy Distribution")).toBeInTheDocument()
    expect(screen.getByText("Today's Stays")).toBeInTheDocument()

    const occupancyCard = screen
      .getByText("Hotel Occupancy Distribution")
      .closest("div.bg-white") as HTMLElement

    expect(
      within(occupancyCard).getByText("Sheraton Addis"),
    ).toBeInTheDocument()
    expect(
      within(occupancyCard).getByText("75% (9/12 rooms)"),
    ).toBeInTheDocument()
    expect(
      within(occupancyCard).getByText("45% (9/20 rooms)"),
    ).toBeInTheDocument()
    expect(
      within(occupancyCard).getByText("20% (2/10 rooms)"),
    ).toBeInTheDocument()

    const bars = getOccupancyBars(container)
    expect(bars).toHaveLength(3)
    expect(bars[0].className).toContain("bg-emerald-600")
    expect(bars[0].style.width).toBe("75%")
    expect(bars[1].className).toContain("bg-blue-600")
    expect(bars[1].style.width).toBe("45%")
    expect(bars[2].className).toContain("bg-amber-500")
    expect(bars[2].style.width).toBe("20%")
  })

  it("falls back to an availability message without occupancy data", () => {
    const { container } = renderCharts({ occupancyBreakdown: undefined })

    expect(
      screen.getByText("All rooms currently available for booking."),
    ).toBeInTheDocument()
    expect(getOccupancyBars(container)).toHaveLength(0)
  })

  it("handles an empty revenue series gracefully", () => {
    const { container } = renderCharts({
      monthlyRevenue: [],
      bookingTrends: [],
    })

    expect(screen.getAllByText("ETB 0").length).toBeGreaterThanOrEqual(1)
    expect(getRevenueHits(container)).toHaveLength(0)
    expect(screen.getByText("Across 0 recorded months")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "30-Day Reservations" }))
    expect(screen.getByText(/0 bookings recorded\)/)).toBeInTheDocument()
    expect(getBookingBars(container)).toHaveLength(0)
  })
})
