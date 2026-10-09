import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RoomCard } from "@/components/domain/RoomCard"
import type { Room, RoomAvailability } from "@/lib/types"

const buildRoom = (overrides: Partial<Room> = {}): Room => ({
  id: "r-1",
  roomNumber: "402",
  type: "DELUXE",
  capacity: 3,
  beds: 2,
  bathroom: 1,
  basePrice: 3200,
  status: "AVAILABLE",
  description: "Corner suite with floor-to-ceiling city views.",
  primaryImageUrl: "/images/room-402.jpg",
  amenities: ["Free Wi-Fi", "Minibar"],
  ...overrides,
})

const buildAvailability = (
  availableAcrossRange: boolean,
  overrides: Partial<RoomAvailability> = {},
): RoomAvailability => ({
  ...buildRoom(),
  availableAcrossRange,
  availableNights: availableAcrossRange ? 3 : 0,
  totalNights: 3,
  priceRange: null,
  ...overrides,
})

describe("RoomCard", () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it("renders the room type, suite number, specs and amenities", () => {
    render(<RoomCard room={buildRoom()} />)

    expect(screen.getByText("DELUXE")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Suite 402" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("DELUXE Suite — Executive Floor"),
    ).toBeInTheDocument()
    expect(screen.getByText("Up to 3 Guests")).toBeInTheDocument()
    expect(screen.getByText("2 Beds")).toBeInTheDocument()
    expect(screen.getByText("1 Bath")).toBeInTheDocument()
    expect(
      screen.getByText("Corner suite with floor-to-ceiling city views."),
    ).toBeInTheDocument()
    expect(screen.getByText("Free Wi-Fi")).toBeInTheDocument()
    expect(screen.getByText("Minibar")).toBeInTheDocument()
  })

  it("uses the singular bed label for a single-bed room", () => {
    render(
      <RoomCard
        room={buildRoom({ beds: 1, description: null, amenities: [] })}
      />,
    )

    expect(screen.getByText("1 Bed")).toBeInTheDocument()
    expect(screen.queryByText(/Beds/)).not.toBeInTheDocument()
  })

  it("hides the description when the room has none", () => {
    const { container } = render(
      <RoomCard room={buildRoom({ description: null })} />,
    )

    expect(container.textContent).not.toContain("floor-to-ceiling")
  })

  it("renders the nightly price in ETB", () => {
    render(<RoomCard room={buildRoom()} />)

    expect(screen.getByText("Nightly Rate")).toBeInTheDocument()
    expect(screen.getByText("ETB 3,200")).toBeInTheDocument()
    expect(screen.getByText("/ night")).toBeInTheDocument()
  })

  it("coerces a string price and falls back to zero for an unusable one", () => {
    const { rerender } = render(
      <RoomCard room={buildRoom({ basePrice: "4500" })} />,
    )
    expect(screen.getByText("ETB 4,500")).toBeInTheDocument()

    rerender(<RoomCard room={buildRoom({ basePrice: "not-a-number" })} />)
    expect(screen.getByText("ETB 0")).toBeInTheDocument()
  })

  it("marks an available room across the stay range", () => {
    render(<RoomCard room={buildAvailability(true)} onSelect={jest.fn()} />)

    expect(screen.getByText("Available")).toBeInTheDocument()
    expect(screen.queryByText("Unavailable")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Select Suite" })).toBeEnabled()
  })

  it("marks an availability-range room as unavailable and blocks selection", async () => {
    const onSelect = jest.fn()
    const user = userEvent.setup()
    render(<RoomCard room={buildAvailability(false)} onSelect={onSelect} />)

    expect(screen.getByText("Unavailable")).toBeInTheDocument()

    const button = screen.getByRole("button", { name: "Select Suite" })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("derives availability from the plain room status", () => {
    const { rerender } = render(
      <RoomCard room={buildRoom({ status: "MAINTENANCE" })} />,
    )
    expect(screen.getByText("Unavailable")).toBeInTheDocument()

    rerender(<RoomCard room={buildRoom({ status: "AVAILABLE" })} />)
    expect(screen.getByText("Available")).toBeInTheDocument()
  })

  it("passes the room to onSelect and labels itself as selected", async () => {
    const room = buildRoom()
    const onSelect = jest.fn()
    const user = userEvent.setup()
    const { container } = render(
      <RoomCard room={room} onSelect={onSelect} isSelected className="extra" />,
    )

    expect(container.querySelector("div")?.className).toContain("ring-2")

    await user.click(screen.getByRole("button", { name: "Selected" }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(room)
  })

  it("builds a reserve link with room and stay parameters when no callback is given", () => {
    render(
      <RoomCard
        room={buildRoom()}
        hotelId="h-1"
        checkIn="2026-01-05"
        checkOut="2026-01-08"
        guests={4}
      />,
    )

    const link = screen.getByRole("link", { name: /Reserve Suite/ })
    expect(link).toHaveAttribute(
      "href",
      "/booking/h-1?room=r-1&checkIn=2026-01-05&checkOut=2026-01-08&guests=4",
    )
    expect(screen.getByRole("button", { name: /Reserve Suite/ })).toBeEnabled()
  })

  it("defaults the reserve link guests parameter to two", () => {
    render(<RoomCard room={buildRoom()} hotelId="h-1" />)

    expect(screen.getByRole("link", { name: /Reserve Suite/ })).toHaveAttribute(
      "href",
      "/booking/h-1?room=r-1&guests=2",
    )
  })

  it("disables the reserve button for an unavailable room", async () => {
    const user = userEvent.setup()
    render(<RoomCard room={buildAvailability(false)} hotelId="h-1" />)

    const button = screen.getByRole("button", { name: /Reserve Suite/ })
    expect(button).toBeDisabled()

    await user.click(button)
    expect(
      screen.getByRole("link", { name: /Reserve Suite/ }),
    ).toBeInTheDocument()
  })

  it("renders no action when neither a callback nor a hotel id is provided", () => {
    render(<RoomCard room={buildRoom()} />)

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("uses the fallback image when the room has no photo", () => {
    render(<RoomCard room={buildRoom({ primaryImageUrl: null })} />)

    const image = screen.getByRole("img", { name: "Suite 402 - DELUXE" })
    expect(image.getAttribute("src")).toContain("Canopy_bed")
  })

  it("swaps to the fallback image after a loading error", () => {
    render(<RoomCard room={buildRoom()} />)

    const image = screen.getByRole("img", { name: "Suite 402 - DELUXE" })
    expect(image.getAttribute("src")).toContain("room-402")

    fireEvent.error(image)

    expect(
      screen
        .getByRole("img", { name: "Suite 402 - DELUXE" })
        .getAttribute("src"),
    ).toContain("Canopy_bed")
  })
})
