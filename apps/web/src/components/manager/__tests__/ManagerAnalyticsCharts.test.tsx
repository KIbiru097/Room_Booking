import { render, screen, fireEvent } from "@testing-library/react"
import { ManagerAnalyticsCharts } from "@/components/manager/ManagerAnalyticsCharts"
import type {
  Room,
  MonthlyRevenueItem,
  DailyBookingTrendItem,
} from "@/lib/types"

const buildRoom = (status: Room["status"], roomNumber: string): Room => ({
  id: `room-${roomNumber}`,
  roomNumber,
  type: "DELUXE",
  capacity: 2,
  beds: 1,
  bathroom: 1,
  basePrice: 2500,
  status,
  amenities: [],
})

const monthlyRevenue: MonthlyRevenueItem[] = Array.from(
  { length: 12 },
  (_, index) => ({
    month: `2025-${String(index + 1).padStart(2, "0")}`,
    revenue: (index + 1) * 1000,
  }),
)

const bookingTrends: DailyBookingTrendItem[] = [
  { date: "2025-06-01", bookings: 0 },
  { date: "2025-06-02", bookings: 1 },
  { date: "2025-06-03", bookings: 4 },
]

const rooms: Room[] = [
  buildRoom("AVAILABLE", "101"),
  buildRoom("CLEANING", "102"),
  buildRoom("MAINTENANCE", "103"),
  buildRoom("UNAVAILABLE", "104"),
]

const getRevenuePoints = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<SVGGElement>("svg g.cursor-pointer"))

const getTrendBars = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('div[style*="height"]'))

describe("ManagerAnalyticsCharts", () => {
  it("renders titles with the hotel name and defaults to the 6 month window", () => {
    const { container } = render(
      <ManagerAnalyticsCharts
        hotelName="Sheraton Addis"
        monthlyRevenue={monthlyRevenue}
      />,
    )

    expect(screen.getByText("Revenue Performance Curve")).toBeInTheDocument()
    expect(
      screen.getByText("Monthly collected revenue stream for Sheraton Addis"),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Past 6M" }).className).toContain(
      "bg-[#0b1528]",
    )
    expect(
      screen.getByRole("button", { name: "Past 12M" }).className,
    ).not.toContain("bg-[#0b1528]")

    const points = getRevenuePoints(container)
    expect(points).toHaveLength(6)
    for (const month of ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]) {
      expect(screen.getByText(month)).toBeInTheDocument()
    }
    expect(screen.queryByText("Jan")).not.toBeInTheDocument()
  })

  it("computes period revenue, peak month and the monthly average for 6M", () => {
    render(
      <ManagerAnalyticsCharts
        hotelName="Sheraton Addis"
        monthlyRevenue={monthlyRevenue}
      />,
    )

    expect(screen.getByText("Period Revenue")).toBeInTheDocument()
    expect(screen.getByText("ETB 57,000")).toBeInTheDocument()
    expect(screen.getByText("Peak Month")).toBeInTheDocument()
    expect(screen.getByText("Dec (ETB 12,000)")).toBeInTheDocument()
    expect(screen.getByText("Monthly Average")).toBeInTheDocument()
    expect(screen.getByText("ETB 9,500")).toBeInTheDocument()
  })

  it("switches to the 12 month window and recomputes the KPIs", () => {
    const { container } = render(
      <ManagerAnalyticsCharts
        hotelName="Sheraton Addis"
        monthlyRevenue={monthlyRevenue}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Past 12M" }))

    expect(
      screen.getByRole("button", { name: "Past 12M" }).className,
    ).toContain("bg-[#0b1528]")
    expect(
      screen.getByRole("button", { name: "Past 6M" }).className,
    ).not.toContain("bg-[#0b1528]")
    expect(getRevenuePoints(container)).toHaveLength(12)
    expect(screen.getByText("Jan")).toBeInTheDocument()
    expect(screen.getByText("ETB 78,000")).toBeInTheDocument()
    expect(screen.getByText("ETB 6,500")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Past 6M" }))
    expect(getRevenuePoints(container)).toHaveLength(6)
  })

  it("shows a revenue tooltip while hovering a data point", () => {
    const { container } = render(
      <ManagerAnalyticsCharts
        hotelName="Sheraton Addis"
        monthlyRevenue={monthlyRevenue}
      />,
    )

    const points = getRevenuePoints(container)
    const lastPoint = points[points.length - 1]
    const pointCircle = lastPoint.querySelector("circle") as SVGCircleElement
    expect(screen.queryByText("ETB 12,000")).not.toBeInTheDocument()

    fireEvent.mouseOver(lastPoint)
    expect(screen.getByText("ETB 12,000")).toBeInTheDocument()
    expect(pointCircle.getAttribute("r")).toBe("6")

    fireEvent.mouseOut(lastPoint)
    expect(screen.queryByText("ETB 12,000")).not.toBeInTheDocument()
    expect(pointCircle.getAttribute("r")).toBe("3.5")
  })

  it("renders the booking velocity bars with totals and per-day pace", () => {
    const { container } = render(
      <ManagerAnalyticsCharts bookingTrends={bookingTrends} />,
    )

    expect(screen.getByText("Booking Velocity")).toBeInTheDocument()
    expect(screen.getByText("5 Total")).toBeInTheDocument()
    expect(screen.getByText("1.7 bookings / day")).toBeInTheDocument()
    expect(screen.getByText("30 Days Activity")).toBeInTheDocument()

    const bars = getTrendBars(container)
    expect(bars).toHaveLength(3)

    expect(screen.getByText("06-01")).toBeInTheDocument()
    expect(screen.getByText("06-03")).toBeInTheDocument()
  })

  it("shows the correct booking count in the bar tooltip", () => {
    const { container } = render(
      <ManagerAnalyticsCharts bookingTrends={bookingTrends} />,
    )
    const bars = getTrendBars(container)

    fireEvent.mouseOver(bars[0].parentElement as Element)
    expect(screen.getByText("0 bookings")).toBeInTheDocument()
    fireEvent.mouseOut(bars[0].parentElement as Element)

    fireEvent.mouseOver(bars[1].parentElement as Element)
    expect(screen.getByText("1 booking")).toBeInTheDocument()
    fireEvent.mouseOut(bars[1].parentElement as Element)

    fireEvent.mouseOver(bars[2].parentElement as Element)
    expect(screen.getByText("4 bookings")).toBeInTheDocument()
    expect(screen.getByText("2025-06-03")).toBeInTheDocument()
  })

  it("breaks the room inventory down into status segments", () => {
    render(<ManagerAnalyticsCharts rooms={rooms} occupiedToday={2} />)

    expect(
      screen.getByText("Room Inventory & Operational Status"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Current room readiness across 4 configured units"),
    ).toBeInTheDocument()
    expect(screen.getByText("1 Ready for Check-in")).toBeInTheDocument()

    expect(screen.getByTitle("Available: 1 (25%)").style.width).toBe("25%")
    expect(screen.getByTitle("Occupied: 2 (50%)").style.width).toBe("50%")
    expect(screen.getByTitle("Cleaning: 1 (25%)").style.width).toBe("25%")
    expect(screen.getByTitle("Maintenance: 1 (25%)").style.width).toBe("25%")

    expect(screen.getByText("25% of total inventory")).toBeInTheDocument()
    expect(screen.getByText("50% occupancy rate")).toBeInTheDocument()
    expect(screen.getByText("25% undergoing turnover")).toBeInTheDocument()
    expect(screen.getByText("25% blocked out-of-service")).toBeInTheDocument()

    const availableCard = screen
      .getByText("25% of total inventory")
      .closest("div")
    expect(availableCard).toHaveTextContent("1")
    expect(availableCard).toHaveTextContent("Available")
  })

  it("falls back to placeholders when no analytics data is available", () => {
    const { container } = render(<ManagerAnalyticsCharts />)

    expect(
      screen.getByText("Monthly collected revenue stream for Hotel"),
    ).toBeInTheDocument()
    expect(screen.getAllByText("ETB 0").length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText("Jul (ETB 0)")).toBeInTheDocument()

    const points = getRevenuePoints(container)
    expect(points).toHaveLength(6)
    for (const month of ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]) {
      expect(screen.getByText(month)).toBeInTheDocument()
    }

    expect(screen.getByText("0 Total")).toBeInTheDocument()
    expect(screen.getByText("Day 1")).toBeInTheDocument()
    expect(screen.getByText("Day 14")).toBeInTheDocument()
    expect(getTrendBars(container)).toHaveLength(14)

    expect(screen.getByText("0 Ready for Check-in")).toBeInTheDocument()
    expect(
      screen.getByText("Current room readiness across 0 configured units"),
    ).toBeInTheDocument()
    expect(screen.getByText("0% of total inventory")).toBeInTheDocument()
    expect(screen.getByText("0% occupancy rate")).toBeInTheDocument()
  })

  it("labels the velocity axis from the raw trend dates", () => {
    const { container } = render(
      <ManagerAnalyticsCharts
        bookingTrends={[{ date: "2025-06-01", count: 2 }]}
      />,
    )

    expect(container).toBeInTheDocument()
    expect(screen.getByText("2 Total")).toBeInTheDocument()
    expect(screen.getAllByText("06-01").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("2.0 bookings / day")).toBeInTheDocument()
  })

  it("uses the trend count field when bookings is missing", () => {
    render(
      <ManagerAnalyticsCharts
        bookingTrends={[{ date: "2025-06-01", count: 7 }]}
      />,
    )

    expect(screen.getByText("7 Total")).toBeInTheDocument()
  })
})
