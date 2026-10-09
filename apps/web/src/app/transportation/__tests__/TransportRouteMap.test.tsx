import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TransportRouteMap, {
  POPULAR_HUBS,
} from "@/app/transportation/TransportRouteMap"

const mockFitBounds = jest.fn()

jest.mock("react-leaflet", () => ({
  MapContainer: ({
    children,
    center,
  }: {
    children?: React.ReactNode
    center?: unknown
  }) => (
    <div data-testid="map-container" data-center={JSON.stringify(center)}>
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({
    position,
    children,
    eventHandlers,
  }: {
    position: [number, number]
    children?: React.ReactNode
    eventHandlers?: { click?: () => void }
  }) => (
    <div data-testid="marker" data-position={JSON.stringify(position)}>
      <button
        type="button"
        data-testid="marker-trigger"
        onClick={() => eventHandlers?.click?.()}
      />
      {children}
    </div>
  ),
  Polyline: ({ positions }: { positions: unknown }) => (
    <div data-testid="polyline" data-positions={JSON.stringify(positions)} />
  ),
  Popup: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => ({ fitBounds: (...args: unknown[]) => mockFitBounds(...args) }),
}))

function summaryDistance() {
  const match = screen.getByText(/km · ~/).textContent?.match(/~?([\d.]+) km/)
  return match ? Number(match[1]) : Number.NaN
}

function summaryDriveMinutes() {
  const match = screen
    .getByText(/km · ~/)
    .textContent?.match(/~(\d+) min drive/)
  return match ? Number(match[1]) : Number.NaN
}

describe("TransportRouteMap", () => {
  beforeEach(() => {
    mockFitBounds.mockClear()
  })

  it("renders the route estimator with every hub available in both selectors", () => {
    render(<TransportRouteMap />)

    expect(
      screen.getByRole("heading", { name: "Transfer Route & Hub Estimator" }),
    ).toBeInTheDocument()

    const [fromSelect, toSelect] = screen.getAllByRole("combobox")
    expect(fromSelect).toHaveValue("bole-airport")
    expect(toSelect).toHaveValue("hyatt-regency")
    expect(within(fromSelect).getAllByRole("option")).toHaveLength(
      POPULAR_HUBS.length,
    )
    expect(within(toSelect).getAllByRole("option")).toHaveLength(
      POPULAR_HUBS.length,
    )
  })

  it("plots a marker for every hub and links it to the route polyline", () => {
    render(<TransportRouteMap />)

    expect(screen.getAllByTestId("marker")).toHaveLength(POPULAR_HUBS.length)

    const polyline = screen.getByTestId("polyline")
    expect(polyline).toHaveAttribute(
      "data-positions",
      JSON.stringify([
        [8.9778, 38.7993],
        [9.012, 38.7635],
      ]),
    )
    expect(mockFitBounds).toHaveBeenCalledWith(
      [
        [8.9778, 38.7993],
        [9.012, 38.7635],
      ],
      { padding: [50, 50], maxZoom: 15, animate: true },
    )
  })

  it("reports distance and drive time for the default airport to hotel route", () => {
    render(<TransportRouteMap onSelectRoute={jest.fn()} />)

    expect(summaryDistance()).toBeGreaterThan(0)
    expect(summaryDriveMinutes()).toBeGreaterThanOrEqual(10)
    expect(
      screen.getByRole("button", { name: /Use This Route/ }),
    ).toBeInTheDocument()
  })

  it("recomputes the estimate when the destination hub changes", async () => {
    const user = userEvent.setup()
    render(<TransportRouteMap />)

    const before = summaryDistance()
    const [, toSelect] = screen.getAllByRole("combobox")

    await user.selectOptions(toSelect, "entoto-park")

    expect(toSelect).toHaveValue("entoto-park")
    expect(summaryDistance()).toBeGreaterThan(before)
    expect(summaryDriveMinutes()).toBeGreaterThanOrEqual(10)
    expect(screen.getByTestId("polyline")).toHaveAttribute(
      "data-positions",
      JSON.stringify([
        [8.9778, 38.7993],
        [9.091, 38.762],
      ]),
    )
  })

  it("recomputes the estimate when the pickup hub changes", async () => {
    const user = userEvent.setup()
    render(<TransportRouteMap />)

    const before = summaryDistance()
    const [fromSelect] = screen.getAllByRole("combobox")

    await user.selectOptions(fromSelect, "entoto-park")

    expect(fromSelect).toHaveValue("entoto-park")
    expect(summaryDistance()).toBeGreaterThan(before)
  })

  it("hands the selected hubs to the parent through onSelectRoute", async () => {
    const user = userEvent.setup()
    const onSelectRoute = jest.fn()

    render(<TransportRouteMap onSelectRoute={onSelectRoute} />)

    await user.click(screen.getByRole("button", { name: /Use This Route/ }))

    expect(onSelectRoute).toHaveBeenCalledWith(
      "Bole International Airport (ADD)",
      "Hyatt Regency Addis Ababa",
    )
  })

  it("omits the CTA when no route handler is provided", () => {
    render(<TransportRouteMap />)

    expect(
      screen.queryByRole("button", { name: /Use This Route/ }),
    ).not.toBeInTheDocument()
  })

  it("sets pickup and drop-off from the marker popups", async () => {
    const user = userEvent.setup()
    render(<TransportRouteMap />)

    const [fromSelect, toSelect] = screen.getAllByRole("combobox")
    const sheratonMarker = screen.getAllByTestId("marker")[3]
    expect(
      within(sheratonMarker).getByText("Sheraton Addis, Luxury Collection"),
    ).toBeInTheDocument()

    await user.click(
      within(sheratonMarker).getByRole("button", { name: "Set Pickup" }),
    )
    expect(fromSelect).toHaveValue("sheraton-addis")
    expect(toSelect).toHaveValue("hyatt-regency")

    const airportMarker = screen.getAllByTestId("marker")[0]
    await user.click(
      within(airportMarker).getByRole("button", { name: "Set Drop-off" }),
    )
    expect(toSelect).toHaveValue("bole-airport")
  })
})
