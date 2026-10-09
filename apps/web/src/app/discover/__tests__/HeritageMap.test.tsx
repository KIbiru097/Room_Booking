import { useState } from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import HeritageMap from "@/app/discover/HeritageMap"
import type { PlaceItem } from "@/lib/services"

const mockFitBounds = jest.fn()
const mockSetView = jest.fn()

jest.mock("react-leaflet", () => ({
  MapContainer: ({
    children,
    center,
    zoom,
  }: {
    children?: React.ReactNode
    center?: unknown
    zoom?: unknown
  }) => (
    <div
      data-testid="map-container"
      data-center={JSON.stringify(center)}
      data-zoom={String(zoom)}
    >
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
  Polyline: ({
    positions,
    pathOptions,
  }: {
    positions: unknown
    pathOptions?: { color?: string }
  }) => (
    <div
      data-testid="polyline"
      data-positions={JSON.stringify(positions)}
      data-color={pathOptions?.color}
    />
  ),
  Circle: ({ radius }: { radius: number }) => (
    <div data-testid="circle" data-radius={String(radius)} />
  ),
  Popup: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => ({
    fitBounds: (...args: unknown[]) => mockFitBounds(...args),
    setView: (...args: unknown[]) => mockSetView(...args),
  }),
}))

function makePlace(overrides: Partial<PlaceItem> = {}): PlaceItem {
  return {
    id: "place-1",
    name: "Fasil Ghebbi",
    description: "Royal enclosure",
    category: "HERITAGE",
    status: "VERIFIED",
    address: "Gondar",
    lat: 12.609,
    lng: 37.47,
    hoursVerified: true,
    rating: 4.8,
    images: [],
    ...overrides,
  }
}

describe("HeritageMap", () => {
  beforeEach(() => {
    localStorage.clear()
    mockFitBounds.mockClear()
    mockSetView.mockClear()
  })

  it("renders one marker per place with usable coordinates", () => {
    render(
      <HeritageMap
        places={[
          makePlace(),
          makePlace({
            id: "place-2",
            name: "Tomoca Coffee",
            lat: 9.03,
            lng: 38.75,
          }),
          makePlace({
            id: "place-broken",
            name: "Unlocated",
            lat: Number.NaN,
            lng: Number.NaN,
          }),
        ]}
      />,
    )

    expect(screen.getByTestId("map-container")).toBeInTheDocument()
    expect(screen.getAllByTestId("marker")).toHaveLength(2)
    expect(screen.queryByText("Unlocated")).not.toBeInTheDocument()
  })

  it("opens the popup content for each marker, including distance from the anchor", () => {
    render(
      <HeritageMap
        places={[makePlace()]}
        searchCenter={{ lat: 9.0105, lng: 38.7612 }}
      />,
    )

    const popup = screen.getByTestId("popup")
    expect(within(popup).getByText("Fasil Ghebbi")).toBeInTheDocument()
    expect(within(popup).getByText(/km away/)).toBeInTheDocument()
    expect(within(popup).getByText("HERITAGE")).toBeInTheDocument()
  })

  it("selects a place on marker click and clears the selection on the second click", async () => {
    const user = userEvent.setup()
    const onSelect = jest.fn()

    function SelectionHarness() {
      const [selected, setSelected] = useState<string | null>(null)
      return (
        <HeritageMap
          places={[makePlace()]}
          selectedPlaceId={selected}
          onSelect={(id) => {
            setSelected(id)
            onSelect(id)
          }}
        />
      )
    }

    render(<SelectionHarness />)

    await user.click(screen.getByTestId("marker-trigger"))
    expect(onSelect).toHaveBeenLastCalledWith("place-1")

    await user.click(screen.getByTestId("marker-trigger"))
    expect(onSelect).toHaveBeenLastCalledWith(null)
  })

  it("draws a route line from the anchor to every place", () => {
    const { rerender } = render(
      <HeritageMap
        places={[
          makePlace(),
          makePlace({ id: "place-2", lat: 9.03, lng: 38.75 }),
        ]}
        searchCenter={{ lat: 9.0105, lng: 38.7612 }}
        showRoutes
      />,
    )

    const lines = screen.getAllByTestId("polyline")
    expect(lines).toHaveLength(2)
    expect(lines[0]).toHaveAttribute(
      "data-positions",
      JSON.stringify([
        [9.0105, 38.7612],
        [12.609, 37.47],
      ]),
    )

    rerender(
      <HeritageMap
        places={[
          makePlace(),
          makePlace({ id: "place-2", lat: 9.03, lng: 38.75 }),
        ]}
        searchCenter={{ lat: 9.0105, lng: 38.7612 }}
        showRoutes={false}
      />,
    )

    expect(screen.queryByTestId("polyline")).not.toBeInTheDocument()
  })

  it("renders the radius circle scaled to kilometres", () => {
    const { rerender } = render(
      <HeritageMap places={[makePlace()]} radiusKm={5} />,
    )

    expect(screen.getByTestId("circle")).toHaveAttribute("data-radius", "5000")

    rerender(<HeritageMap places={[makePlace()]} radiusKm={0} />)
    expect(screen.queryByTestId("circle")).not.toBeInTheDocument()
  })

  it("anchors the map on the hotel, then the user, then the search centre", () => {
    const { rerender } = render(<HeritageMap places={[]} />)
    expect(screen.getByTestId("map-container")).toHaveAttribute(
      "data-center",
      JSON.stringify([9.0105, 38.7612]),
    )

    rerender(<HeritageMap places={[makePlace()]} />)
    expect(screen.getByTestId("map-container")).toHaveAttribute(
      "data-center",
      JSON.stringify([12.609, 37.47]),
    )

    rerender(
      <HeritageMap
        places={[makePlace()]}
        searchCenter={{ lat: 8.5, lng: 38.1 }}
      />,
    )
    expect(screen.getByTestId("map-container")).toHaveAttribute(
      "data-center",
      JSON.stringify([8.5, 38.1]),
    )

    rerender(
      <HeritageMap
        places={[makePlace()]}
        searchCenter={{ lat: 8.5, lng: 38.1 }}
        userLocation={{ lat: 9.1, lng: 38.9 }}
      />,
    )
    expect(screen.getByTestId("map-container")).toHaveAttribute(
      "data-center",
      JSON.stringify([9.1, 38.9]),
    )

    rerender(
      <HeritageMap
        places={[makePlace()]}
        searchCenter={{ lat: 8.5, lng: 38.1 }}
        userLocation={{ lat: 9.1, lng: 38.9 }}
        hotel={{ name: "Goha Hotel", lat: 11.6, lng: 37.4 }}
      />,
    )
    expect(screen.getByTestId("map-container")).toHaveAttribute(
      "data-center",
      JSON.stringify([11.6, 37.4]),
    )
  })

  it("adds hotel and user-location markers next to the place markers", () => {
    render(
      <HeritageMap
        places={[makePlace()]}
        hotel={{ name: "Goha Hotel", lat: 11.6, lng: 37.4 }}
        userLocation={{ lat: 9.1, lng: 38.9 }}
      />,
    )

    expect(screen.getAllByTestId("marker")).toHaveLength(3)
    expect(screen.getByText("Your Current Location")).toBeInTheDocument()
    expect(screen.getByText("Your Hotel Anchor")).toBeInTheDocument()
    expect(screen.getByText("Goha Hotel")).toBeInTheDocument()
  })

  it("fits bounds for several coordinates and pans for a single one", () => {
    const { rerender } = render(
      <HeritageMap
        places={[
          makePlace(),
          makePlace({ id: "place-2", lat: 9.03, lng: 38.75 }),
        ]}
      />,
    )

    expect(mockFitBounds).toHaveBeenCalledTimes(1)
    expect(mockFitBounds).toHaveBeenCalledWith(
      [
        [12.609, 37.47],
        [9.03, 38.75],
      ],
      { padding: [45, 45], maxZoom: 15, animate: true },
    )

    rerender(<HeritageMap places={[makePlace()]} />)
    expect(mockSetView).toHaveBeenCalledWith([12.609, 37.47], 14, {
      animate: true,
    })
  })

  it("exposes popup actions for itineraries, AI, and details", async () => {
    const user = userEvent.setup()
    const onAddToTrip = jest.fn()
    const onAskAi = jest.fn()
    const place = makePlace()

    render(
      <HeritageMap
        places={[place]}
        onAddToTrip={onAddToTrip}
        onAskAi={onAskAi}
        detailUrlPrefix="/discover/heritage"
      />,
    )

    await user.click(screen.getByRole("button", { name: "+ Add to Trip" }))
    expect(onAddToTrip).toHaveBeenCalledWith(place)

    await user.click(screen.getByRole("button", { name: /Ask AI/ }))
    expect(onAskAi).toHaveBeenCalledWith(place)

    expect(screen.getByRole("link", { name: "Details" })).toHaveAttribute(
      "href",
      "/discover/heritage/place-1",
    )
  })

  it("hides the optional popup actions when no handlers are supplied", () => {
    render(<HeritageMap places={[makePlace()]} />)

    expect(
      screen.queryByRole("button", { name: "+ Add to Trip" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Ask AI/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Details" })).toHaveAttribute(
      "href",
      "/discover/place-1",
    )
  })
})
