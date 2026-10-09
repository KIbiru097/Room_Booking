import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ConfirmationPanel } from "@/components/domain/ConfirmationPanel"
import { bookingService } from "@/services/booking.service"
import type { Booking, Hotel } from "@/lib/types"

jest.mock("@/services/booking.service", () => ({
  bookingService: {
    downloadInvoice: jest.fn(),
    getInvoiceDownloadUrl: jest.fn(
      (id: string) => `/api/bookings/${id}/invoice`,
    ),
  },
}))

const book = bookingService as unknown as Record<string, jest.Mock>

const buildBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: "BK-2026-0042",
  userId: "u-1",
  hotelId: "h-1",
  checkIn: "2026-01-05",
  checkOut: "2026-01-08",
  status: "CONFIRMED",
  totalPrice: 8400,
  createdAt: "2025-12-20T00:00:00.000Z",
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
  images: [],
  amenities: [],
  rooms: [],
  createdAt: "2025-12-01T00:00:00.000Z",
  updatedAt: "2025-12-01T00:00:00.000Z",
  ...overrides,
})

const formatStayDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`))

describe("ConfirmationPanel", () => {
  const originalOpenDescriptor = Object.getOwnPropertyDescriptor(window, "open")

  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
    book.downloadInvoice.mockResolvedValue(undefined)
    book.getInvoiceDownloadUrl.mockImplementation(
      (id: string) => `/api/bookings/${id}/invoice`,
    )
    Object.defineProperty(window, "open", {
      configurable: true,
      writable: true,
      value: jest.fn(),
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    if (originalOpenDescriptor)
      Object.defineProperty(window, "open", originalOpenDescriptor)
    else delete (window as unknown as Record<string, unknown>).open
  })

  // userEvent.setup() replaces navigator.clipboard with its own stub, so the
  // writeText method has to be wrapped after the session is created.
  const stubClipboardWrite = () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(window.navigator.clipboard, "writeText", {
      configurable: true,
      writable: true,
      value: writeText,
    })
    return writeText
  }

  it("shows the success badge, icon and confirmation copy", () => {
    const { container } = render(
      <ConfirmationPanel
        booking={buildBooking()}
        hotel={buildHotel()}
        roomType="DELUXE_SUITE"
      />,
    )

    expect(container.querySelector(".bg-emerald-50 svg")).not.toBeNull()
    expect(
      screen.getByRole("heading", { name: "Reservation Confirmed" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Your booking at Skylight Hotel has been successfully registered/,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("Confirmed")).toBeInTheDocument()
  })

  it("falls back to the brand name when no hotel is supplied", () => {
    render(<ConfirmationPanel booking={buildBooking()} />)

    expect(
      screen.getByText(
        /Your booking at LuxStay has been successfully registered/,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("Luxury Hotel")).toBeInTheDocument()
  })

  it("renders the booking reference and lets the guest copy it", async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const writeText = stubClipboardWrite()
    render(<ConfirmationPanel booking={buildBooking()} hotel={buildHotel()} />)

    expect(screen.getByText("Booking Reference")).toBeInTheDocument()
    expect(screen.getByText("BK-2026-0042")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Copy Reference" }))

    expect(writeText).toHaveBeenCalledWith("BK-2026-0042")
    expect(
      screen.getByRole("button", { name: "Copied Reference" }),
    ).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(
      screen.getByRole("button", { name: "Copy Reference" }),
    ).toBeInTheDocument()
  })

  it("ignores the copy action when the booking has no reference", async () => {
    const user = userEvent.setup()
    const writeText = stubClipboardWrite()
    render(
      <ConfirmationPanel
        booking={buildBooking({ id: "" })}
        hotel={buildHotel()}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Copy Reference" }))

    expect(writeText).not.toHaveBeenCalled()
    expect(
      screen.getByRole("button", { name: "Copy Reference" }),
    ).toBeInTheDocument()
  })

  it("itemizes the hotel, suite, dates, payment method and total", () => {
    render(
      <ConfirmationPanel
        booking={buildBooking()}
        hotel={buildHotel()}
        roomType="DELUXE_SUITE"
        paymentMethod="MOBILE_MONEY"
      />,
    )

    expect(screen.getByText("Hotel Property")).toBeInTheDocument()
    expect(screen.getByText("Skylight Hotel")).toBeInTheDocument()
    expect(screen.getByText("Bole Road, Addis Ababa")).toBeInTheDocument()
    expect(screen.getByText("Reserved Suite")).toBeInTheDocument()
    expect(screen.getByText("DELUXE SUITE")).toBeInTheDocument()
    expect(screen.getByText("Check-in Date")).toBeInTheDocument()
    expect(screen.getByText(formatStayDate("2026-01-05"))).toBeInTheDocument()
    expect(screen.getByText("Check-out Date")).toBeInTheDocument()
    expect(screen.getByText(formatStayDate("2026-01-08"))).toBeInTheDocument()
    expect(screen.getByText("Payment Method")).toBeInTheDocument()
    expect(screen.getByText("MOBILE MONEY")).toBeInTheDocument()
    expect(screen.getByText("Total Amount")).toBeInTheDocument()
    expect(screen.getByText("ETB 8,400")).toBeInTheDocument()
  })

  it("defaults the suite and payment method labels", () => {
    render(<ConfirmationPanel booking={buildBooking()} hotel={buildHotel()} />)

    expect(screen.getByText("Luxury Suite")).toBeInTheDocument()
    expect(screen.getByText("CREDIT CARD")).toBeInTheDocument()
  })

  it("downloads the invoice and disables the button while the request is in flight", async () => {
    const user = userEvent.setup()
    let resolveInvoice: () => void = () => undefined
    book.downloadInvoice.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveInvoice = resolve
        }),
    )
    render(<ConfirmationPanel booking={buildBooking()} hotel={buildHotel()} />)

    const button = screen.getByRole("button", { name: /Download PDF Invoice/ })
    await user.click(button)

    expect(book.downloadInvoice).toHaveBeenCalledWith("BK-2026-0042")
    expect(button).toBeDisabled()
    expect(button.querySelector(".animate-spin")).not.toBeNull()

    await act(async () => {
      resolveInvoice()
    })

    expect(button).toBeEnabled()
    expect(window.open).not.toHaveBeenCalled()
  })

  it("falls back to opening the invoice URL when the download fails", async () => {
    const user = userEvent.setup()
    book.downloadInvoice.mockRejectedValue(new Error("network down"))
    render(<ConfirmationPanel booking={buildBooking()} hotel={buildHotel()} />)

    await user.click(
      screen.getByRole("button", { name: /Download PDF Invoice/ }),
    )

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        "/api/bookings/BK-2026-0042/invoice",
        "_blank",
      )
    })
    expect(
      screen.getByRole("button", { name: /Download PDF Invoice/ }),
    ).toBeEnabled()
  })

  it("links to the bookings dashboard and back to browsing", () => {
    render(<ConfirmationPanel booking={buildBooking()} hotel={buildHotel()} />)

    expect(
      screen.getByRole("link", { name: /View in My Bookings/ }),
    ).toHaveAttribute("href", "/dashboard")
    expect(
      screen.getByRole("link", { name: /Explore More Hotels/ }),
    ).toHaveAttribute("href", "/search")
  })
})
