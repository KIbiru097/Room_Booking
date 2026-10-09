import { apiClient, API_BASE_URL } from "@/lib/axios"
import { bookingService } from "@/services/booking.service"

const SESSION_KEY = "yayetech.session"
const LEGACY_SESSION_KEY = "luxstay.session"

interface Spies {
  get: jest.SpyInstance
  post: jest.SpyInstance
  delete: jest.SpyInstance
}

let spy: Spies

beforeEach(() => {
  window.localStorage.clear()
  spy = {
    get: jest
      .spyOn(apiClient, "get")
      .mockResolvedValue({ data: null } as never),
    post: jest
      .spyOn(apiClient, "post")
      .mockResolvedValue({ data: null } as never),
    delete: jest
      .spyOn(apiClient, "delete")
      .mockResolvedValue({ data: null } as never),
  }
})

afterEach(() => {
  jest.restoreAllMocks()
})

const quoteInput = {
  hotelId: "hotel-1",
  roomIds: ["room-1", "room-2"],
  checkIn: "2026-05-01",
  checkOut: "2026-05-04",
  guests: { adults: 2, children: 1 },
}

const bookingInput = {
  ...quoteInput,
  guestInfos: [{ fullName: "Guest User", email: "guest@example.com" }],
  paymentMethod: "CREDIT_CARD" as const,
  bookingSource: "ONLINE" as const,
}

describe("bookingService.getCheckoutQuote", () => {
  it("posts the quote request and unwraps the total", async () => {
    const quote = { nights: 3, total: 420 }
    spy.post.mockResolvedValue({ data: quote } as never)

    const result = await bookingService.getCheckoutQuote(quoteInput)

    expect(spy.post).toHaveBeenCalledWith("/bookings/checkout", quoteInput)
    expect(result).toEqual(quote)
  })
})

describe("bookingService.createBooking", () => {
  it("posts the booking payload", async () => {
    const booking = { id: "booking-1", bookingRef: "BK-1" }
    spy.post.mockResolvedValue({ data: booking } as never)

    const result = await bookingService.createBooking(bookingInput)

    expect(spy.post).toHaveBeenCalledWith("/bookings", bookingInput)
    expect(result).toEqual(booking)
  })
})

describe("bookingService.getMyBookings", () => {
  it("lists bookings without a scope", async () => {
    spy.get.mockResolvedValue({ data: { data: [], total: 0 } } as never)

    await bookingService.getMyBookings()

    expect(spy.get).toHaveBeenCalledWith("/bookings/my")
  })

  it("filters by scope", async () => {
    spy.get.mockResolvedValue({ data: { data: [], total: 0 } } as never)

    await bookingService.getMyBookings("upcoming")

    expect(spy.get).toHaveBeenCalledWith("/bookings/my?scope=upcoming")
  })
})

describe("bookingService.cancelBooking", () => {
  it("posts to the cancel endpoint", async () => {
    const booking = { id: "booking-1", status: "CANCELLED" }
    spy.post.mockResolvedValue({ data: booking } as never)

    const result = await bookingService.cancelBooking("booking-1")

    expect(spy.post).toHaveBeenCalledWith("/bookings/booking-1/cancel")
    expect(result).toEqual(booking)
  })
})

describe("bookingService room holds", () => {
  it("creates a hold", async () => {
    const hold = {
      roomId: "room-1",
      checkIn: "2026-05-01",
      checkOut: "2026-05-04",
    }
    spy.post.mockResolvedValue({ data: { id: "hold-1" } } as never)

    await bookingService.createHold(hold)

    expect(spy.post).toHaveBeenCalledWith("/bookings/holds", hold)
  })

  it("releases a hold", async () => {
    await bookingService.releaseHold("hold-1")

    expect(spy.delete).toHaveBeenCalledWith("/bookings/holds/hold-1")
  })
})

describe("bookingService stay changes", () => {
  it("requests an early check-in", async () => {
    await bookingService.createStayRequest("booking-1", {
      type: "EARLY_CHECK_IN",
      requestedTime: "10:00",
    })

    expect(spy.post).toHaveBeenCalledWith("/bookings/booking-1/stay-requests", {
      type: "EARLY_CHECK_IN",
      requestedTime: "10:00",
    })
  })

  it("submits a modification request", async () => {
    await bookingService.modifyBooking("booking-1", {
      checkIn: "2026-06-01",
      checkOut: "2026-06-05",
      reason: "flight change",
    })

    expect(spy.post).toHaveBeenCalledWith("/bookings/booking-1/modify", {
      checkIn: "2026-06-01",
      checkOut: "2026-06-05",
      reason: "flight change",
    })
  })
})

describe("bookingService invoices", () => {
  const originalCreate = window.URL.createObjectURL
  const originalRevoke = window.URL.revokeObjectURL
  let createObjectURL: jest.Mock
  let revokeObjectURL: jest.Mock
  let clickSpy: jest.SpyInstance

  beforeEach(() => {
    createObjectURL = jest.fn(() => "blob:invoice")
    revokeObjectURL = jest.fn()
    Reflect.set(window.URL, "createObjectURL", createObjectURL)
    Reflect.set(window.URL, "revokeObjectURL", revokeObjectURL)
    clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined)
  })

  afterEach(() => {
    if (originalCreate === undefined) {
      Reflect.deleteProperty(window.URL, "createObjectURL")
    } else {
      Reflect.set(window.URL, "createObjectURL", originalCreate)
    }
    if (originalRevoke === undefined) {
      Reflect.deleteProperty(window.URL, "revokeObjectURL")
    } else {
      Reflect.set(window.URL, "revokeObjectURL", originalRevoke)
    }
    clickSpy.mockRestore()
  })

  it("downloads the invoice blob with a default filename", async () => {
    spy.get.mockResolvedValue({
      data: new Blob(["pdf"], { type: "application/pdf" }),
    } as never)

    await bookingService.downloadInvoice("booking-1")

    expect(spy.get).toHaveBeenCalledWith("/bookings/booking-1/invoice", {
      responseType: "blob",
    })
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(clickSpy.mock.contexts[0]).toMatchObject({
      download: "invoice-booking-1.pdf",
    })
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:invoice")
    expect(document.body.querySelector("a")).toBeNull()
  })

  it("honours a caller supplied filename", async () => {
    spy.get.mockResolvedValue({ data: new Blob(["pdf"]) } as never)

    await bookingService.downloadInvoice("booking-1", "custom.pdf")

    expect(clickSpy.mock.contexts[0]).toMatchObject({ download: "custom.pdf" })
  })

  it("builds the invoice URL without a token when nothing is stored", () => {
    expect(bookingService.getInvoiceDownloadUrl("booking-1")).toBe(
      `${API_BASE_URL}/bookings/booking-1/invoice`,
    )
  })

  it("appends an explicitly supplied token", () => {
    expect(
      bookingService.getInvoiceDownloadUrl("booking-1", "explicit-token"),
    ).toBe(`${API_BASE_URL}/bookings/booking-1/invoice?token=explicit-token`)
  })

  it("reads the token from the primary session key", () => {
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ accessToken: "stored-token", refreshToken: "r" }),
    )

    expect(bookingService.getInvoiceDownloadUrl("booking-1")).toBe(
      `${API_BASE_URL}/bookings/booking-1/invoice?token=stored-token`,
    )
  })

  it("falls back to the legacy session key", () => {
    window.localStorage.setItem(
      LEGACY_SESSION_KEY,
      JSON.stringify({ accessToken: "legacy-token", refreshToken: "r" }),
    )

    expect(bookingService.getInvoiceDownloadUrl("booking-1")).toBe(
      `${API_BASE_URL}/bookings/booking-1/invoice?token=legacy-token`,
    )
  })

  it("ignores a corrupt stored session", () => {
    window.localStorage.setItem(SESSION_KEY, "{not-json")

    expect(bookingService.getInvoiceDownloadUrl("booking-1")).toBe(
      `${API_BASE_URL}/bookings/booking-1/invoice`,
    )
  })
})
