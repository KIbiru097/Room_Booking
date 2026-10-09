import * as React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-store"
import type { User } from "@/lib/types"
import { paymentService } from "@/services/payment.service"
import {
  useCreatePaymentIntentMutation,
  useMarkCashPaidMutation,
  useMockPaymentCallbackMutation,
  useMyPaymentsQuery,
  usePaymentStatusPolling,
  useRefundPaymentMutation,
} from "@/hooks/use-payment"

jest.mock("@/services/payment.service", () => ({
  paymentService: {
    createIntent: jest.fn(),
    getMyPayments: jest.fn(),
    mockCallback: jest.fn(),
    refundPayment: jest.fn(),
    markCashPaid: jest.fn(),
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

describe("useCreatePaymentIntentMutation", () => {
  it("creates the intent and refreshes payment history", async () => {
    asMock(paymentService.createIntent).mockResolvedValue({
      id: "pay-1",
      status: "PENDING",
    })

    const { result } = renderHook(() => useCreatePaymentIntentMutation(), {
      wrapper,
    })
    result.current.mutate({ bookingId: "booking-1", method: "TELEBIRR" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(paymentService.createIntent).toHaveBeenCalledWith(
      "booking-1",
      "TELEBIRR",
    )
    expect(result.current.data).toEqual({ id: "pay-1", status: "PENDING" })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["payments", "my"] })
  })

  it("surfaces gateway failures", async () => {
    asMock(paymentService.createIntent).mockRejectedValue(new Error("declined"))

    const { result } = renderHook(() => useCreatePaymentIntentMutation(), {
      wrapper,
    })
    result.current.mutate({ bookingId: "booking-1", method: "CREDIT_CARD" })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(new Error("declined"))
  })
})

describe("useMyPaymentsQuery", () => {
  it("stays idle without a signed in user", async () => {
    const { result } = renderHook(() => useMyPaymentsQuery(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(paymentService.getMyPayments).not.toHaveBeenCalled()
  })

  it("loads the payment history for a signed in user", async () => {
    asMock(paymentService.getMyPayments).mockResolvedValue({
      data: [{ id: "pay-1" }],
    })
    useAuth.setState({ user: customer })

    const { result } = renderHook(() => useMyPaymentsQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(paymentService.getMyPayments).toHaveBeenCalledTimes(1)
    expect(client.getQueryData(["payments", "my"])).toEqual({
      data: [{ id: "pay-1" }],
    })
  })
})

describe("usePaymentStatusPolling", () => {
  it("does not poll unless explicitly enabled", async () => {
    useAuth.setState({ user: customer })

    const { result } = renderHook(() => usePaymentStatusPolling("booking-1"), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(paymentService.getMyPayments).not.toHaveBeenCalled()
  })

  it("stays idle without a booking id", async () => {
    useAuth.setState({ user: customer })

    const { result } = renderHook(() => usePaymentStatusPolling(null, true), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(paymentService.getMyPayments).not.toHaveBeenCalled()
  })

  it("stays idle for signed out visitors", async () => {
    const { result } = renderHook(
      () => usePaymentStatusPolling("booking-1", true),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(paymentService.getMyPayments).not.toHaveBeenCalled()
  })

  it("returns the matching payment for the booking", async () => {
    useAuth.setState({ user: customer })
    asMock(paymentService.getMyPayments).mockResolvedValue({
      data: [
        { id: "pay-other", bookingId: "booking-2", status: "SUCCEEDED" },
        { id: "pay-1", bookingId: "booking-1", status: "PENDING" },
      ],
    })

    const { result } = renderHook(
      () => usePaymentStatusPolling("booking-1", true),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      id: "pay-1",
      bookingId: "booking-1",
      status: "PENDING",
    })
  })

  it("resolves to null when the booking has no payment", async () => {
    useAuth.setState({ user: customer })
    asMock(paymentService.getMyPayments).mockResolvedValue({
      data: [{ id: "pay-other", bookingId: "booking-2", status: "SUCCEEDED" }],
    })

    const { result } = renderHook(
      () => usePaymentStatusPolling("booking-1", true),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeNull()
  })

  it("polls every two seconds until a terminal status arrives", async () => {
    useAuth.setState({ user: customer })
    asMock(paymentService.getMyPayments).mockResolvedValue({ data: [] })

    renderHook(() => usePaymentStatusPolling("booking-1", true), { wrapper })

    await waitFor(() =>
      expect(
        client
          .getQueryCache()
          .find({ queryKey: ["payment-status", "booking-1"] }),
      ).toBeDefined(),
    )

    const query = client
      .getQueryCache()
      .find({ queryKey: ["payment-status", "booking-1"] })
    const observer = query?.observers[0]
    const refetchInterval = observer?.options
      .refetchInterval as unknown as (q: {
      state: { data?: { status?: string } | null }
    }) => number | false | undefined

    expect(typeof refetchInterval).toBe("function")
    expect(refetchInterval({ state: { data: undefined } })).toBe(2000)
    expect(refetchInterval({ state: { data: { status: "PENDING" } } })).toBe(
      2000,
    )
    expect(refetchInterval({ state: { data: { status: "SUCCEEDED" } } })).toBe(
      false,
    )
    expect(refetchInterval({ state: { data: { status: "FAILED" } } })).toBe(
      false,
    )
    expect(refetchInterval({ state: { data: { status: "REFUNDED" } } })).toBe(
      false,
    )
  })
})

describe("useMockPaymentCallbackMutation", () => {
  it("forwards the callback data and refreshes dependent caches", async () => {
    asMock(paymentService.mockCallback).mockResolvedValue({
      status: "SUCCEEDED",
    })

    const { result } = renderHook(() => useMockPaymentCallbackMutation(), {
      wrapper,
    })
    result.current.mutate({
      bookingId: "booking-1",
      reference: "REF-1",
      transactionId: "TX-1",
      message: "paid",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(paymentService.mockCallback).toHaveBeenCalledWith("booking-1", {
      reference: "REF-1",
      transactionId: "TX-1",
      message: "paid",
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["payments"] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["bookings"] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["hotel"] })
  })
})

describe("useRefundPaymentMutation", () => {
  it("refunds and refreshes payments and bookings", async () => {
    asMock(paymentService.refundPayment).mockResolvedValue({
      status: "REFUNDED",
    })

    const { result } = renderHook(() => useRefundPaymentMutation(), { wrapper })
    result.current.mutate("booking-1")

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(paymentService.refundPayment).toHaveBeenCalledWith("booking-1")
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["payments"] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["bookings"] })
  })
})

describe("useMarkCashPaidMutation", () => {
  it("records the cash payment with its reference", async () => {
    asMock(paymentService.markCashPaid).mockResolvedValue({
      status: "SUCCEEDED",
    })

    const { result } = renderHook(() => useMarkCashPaidMutation(), { wrapper })
    result.current.mutate({ bookingId: "booking-1", reference: "CASH-1" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(paymentService.markCashPaid).toHaveBeenCalledWith(
      "booking-1",
      "CASH-1",
    )
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["payments"] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["bookings"] })
  })
})
