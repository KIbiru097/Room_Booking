import * as React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-store"
import type { User } from "@/lib/types"
import { bookingService } from "@/services/booking.service"
import {
  useCancelBookingMutation,
  useCheckoutQuoteQuery,
  useCreateBookingMutation,
  useCreateHoldMutation,
  useCreateStayRequestMutation,
  useModifyBookingMutation,
  useMyBookingsQuery,
  useReleaseHoldMutation,
} from "@/hooks/use-booking"

jest.mock("@/services/booking.service", () => ({
  bookingService: {
    getCheckoutQuote: jest.fn(),
    createBooking: jest.fn(),
    getMyBookings: jest.fn(),
    cancelBooking: jest.fn(),
    createHold: jest.fn(),
    releaseHold: jest.fn(),
    createStayRequest: jest.fn(),
    modifyBooking: jest.fn(),
  },
}))

const asMock = (fn: unknown): jest.Mock => fn as jest.Mock

const customer: User = {
  id: "user-1",
  email: "guest@example.com",
  fullName: "Guest User",
  role: "CUSTOMER",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

const checkoutInput = {
  hotelId: "hotel-1",
  roomIds: ["room-1"],
  checkIn: "2026-05-01",
  checkOut: "2026-05-04",
  guests: { adults: 2, children: 1 },
}

const bookingInput = {
  ...checkoutInput,
  guestInfos: [{ fullName: "Guest User", email: "guest@example.com" }],
  paymentMethod: "CREDIT_CARD" as const,
  bookingSource: "ONLINE" as const,
}

let client: QueryClient
let invalidateSpy: jest.SpyInstance

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
)

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  jest.clearAllMocks()
  invalidateSpy = jest.spyOn(client, "invalidateQueries")
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
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("useCheckoutQuoteQuery", () => {
  it("requests a quote for a complete booking request", async () => {
    asMock(bookingService.getCheckoutQuote).mockResolvedValue({
      nights: 3,
      total: 420,
    })

    const { result } = renderHook(() => useCheckoutQuoteQuery(checkoutInput), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(bookingService.getCheckoutQuote).toHaveBeenCalledWith(checkoutInput)
    expect(result.current.data).toEqual({ nights: 3, total: 420 })
  })

  it("stays idle without an input", async () => {
    const { result } = renderHook(() => useCheckoutQuoteQuery(null), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(bookingService.getCheckoutQuote).not.toHaveBeenCalled()
  })

  it("stays idle when rooms are missing", async () => {
    const { result } = renderHook(
      () => useCheckoutQuoteQuery({ ...checkoutInput, roomIds: [] }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(bookingService.getCheckoutQuote).not.toHaveBeenCalled()
  })

  it("stays idle when checkout dates are missing", async () => {
    const { result } = renderHook(
      () =>
        useCheckoutQuoteQuery({
          ...checkoutInput,
          checkOut: undefined as unknown as string,
        }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(bookingService.getCheckoutQuote).not.toHaveBeenCalled()
  })

  it("stays idle when the query is explicitly disabled", async () => {
    const { result } = renderHook(
      () => useCheckoutQuoteQuery(checkoutInput, false),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(bookingService.getCheckoutQuote).not.toHaveBeenCalled()
  })

  it("keys the cache by the quote inputs", async () => {
    asMock(bookingService.getCheckoutQuote).mockResolvedValue({
      nights: 3,
      total: 420,
    })

    renderHook(() => useCheckoutQuoteQuery(checkoutInput), { wrapper })

    await waitFor(() => {
      const matches = client.getQueryCache().findAll({
        queryKey: ["checkout-quote", "hotel-1", ["room-1"]],
      })
      expect(matches).toHaveLength(1)
      expect(matches[0].state.data).toEqual({ nights: 3, total: 420 })
    })

    expect(
      client
        .getQueryCache()
        .findAll({ queryKey: ["checkout-quote", "hotel-2"] }),
    ).toHaveLength(0)
    expect(
      client
        .getQueryCache()
        .findAll({ queryKey: ["checkout-quote", "hotel-1", ["room-2"]] }),
    ).toHaveLength(0)
  })
})

describe("useCreateBookingMutation", () => {
  it("creates the booking and refreshes availability", async () => {
    asMock(bookingService.createBooking).mockResolvedValue({ id: "booking-1" })

    const { result } = renderHook(() => useCreateBookingMutation(), { wrapper })
    result.current.mutate(bookingInput)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(bookingService.createBooking).toHaveBeenCalledWith(bookingInput)
    expect(result.current.data).toEqual({ id: "booking-1" })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["hotel"] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["bookings", "my"] })
  })
})

describe("useMyBookingsQuery", () => {
  it("stays idle without a signed in user", async () => {
    const { result } = renderHook(() => useMyBookingsQuery(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(bookingService.getMyBookings).not.toHaveBeenCalled()
  })

  it("loads the booking list for a signed in user", async () => {
    asMock(bookingService.getMyBookings).mockResolvedValue({
      data: [],
      total: 0,
    })
    useAuth.setState({ user: customer })

    const { result } = renderHook(() => useMyBookingsQuery("upcoming"), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(bookingService.getMyBookings).toHaveBeenCalledWith("upcoming")
    expect(client.getQueryData(["bookings", "my", "upcoming"])).toEqual({
      data: [],
      total: 0,
    })
  })

  it("keeps scopes in separate cache entries", async () => {
    asMock(bookingService.getMyBookings).mockResolvedValue({
      data: [],
      total: 0,
    })
    useAuth.setState({ user: customer })

    renderHook(() => useMyBookingsQuery("past"), { wrapper })

    await waitFor(() =>
      expect(
        client.getQueryCache().find({ queryKey: ["bookings", "my", "past"] }),
      ).toBeDefined(),
    )
    expect(
      client.getQueryCache().find({ queryKey: ["bookings", "my", "upcoming"] }),
    ).toBeUndefined()
  })
})

describe("useCancelBookingMutation", () => {
  it("cancels the booking and refreshes lists", async () => {
    asMock(bookingService.cancelBooking).mockResolvedValue({ id: "booking-1" })

    const { result } = renderHook(() => useCancelBookingMutation(), { wrapper })
    result.current.mutate("booking-1")

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(bookingService.cancelBooking).toHaveBeenCalledWith("booking-1")
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["bookings", "my"] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["hotel"] })
  })
})

describe("useCreateHoldMutation", () => {
  it("holds the room", async () => {
    asMock(bookingService.createHold).mockResolvedValue({ id: "hold-1" })

    const { result } = renderHook(() => useCreateHoldMutation(), { wrapper })
    result.current.mutate({
      roomId: "room-1",
      checkIn: "2026-05-01",
      checkOut: "2026-05-04",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(bookingService.createHold).toHaveBeenCalledWith({
      roomId: "room-1",
      checkIn: "2026-05-01",
      checkOut: "2026-05-04",
    })
  })
})

describe("useReleaseHoldMutation", () => {
  it("releases the hold", async () => {
    asMock(bookingService.releaseHold).mockResolvedValue(undefined)

    const { result } = renderHook(() => useReleaseHoldMutation(), { wrapper })
    result.current.mutate("hold-1")

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(bookingService.releaseHold).toHaveBeenCalledWith("hold-1")
  })
})

describe("useCreateStayRequestMutation", () => {
  it("splits the booking id from the stay request payload", async () => {
    asMock(bookingService.createStayRequest).mockResolvedValue({
      id: "request-1",
    })

    const { result } = renderHook(() => useCreateStayRequestMutation(), {
      wrapper,
    })
    result.current.mutate({
      bookingId: "booking-1",
      type: "EARLY_CHECK_IN",
      requestedTime: "10:00",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(bookingService.createStayRequest).toHaveBeenCalledWith("booking-1", {
      type: "EARLY_CHECK_IN",
      requestedTime: "10:00",
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["bookings", "my"] })
  })
})

describe("useModifyBookingMutation", () => {
  it("forwards the change request and refreshes availability", async () => {
    asMock(bookingService.modifyBooking).mockResolvedValue({ id: "booking-1" })

    const { result } = renderHook(() => useModifyBookingMutation(), { wrapper })
    result.current.mutate({
      bookingId: "booking-1",
      checkIn: "2026-06-01",
      checkOut: "2026-06-05",
      reason: "flight change",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(bookingService.modifyBooking).toHaveBeenCalledWith("booking-1", {
      checkIn: "2026-06-01",
      checkOut: "2026-06-05",
      reason: "flight change",
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["bookings", "my"] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["hotel"] })
  })

  it("omits the reason when none is given", async () => {
    asMock(bookingService.modifyBooking).mockResolvedValue({ id: "booking-1" })

    const { result } = renderHook(() => useModifyBookingMutation(), { wrapper })
    result.current.mutate({
      bookingId: "booking-1",
      checkIn: "2026-06-01",
      checkOut: "2026-06-05",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(bookingService.modifyBooking).toHaveBeenCalledWith("booking-1", {
      checkIn: "2026-06-01",
      checkOut: "2026-06-05",
      reason: undefined,
    })
  })
})
