import { apiClient } from "@/lib/axios"
import { paymentService } from "@/services/payment.service"

const DEFAULT_SECRET =
  process.env.NEXT_PUBLIC_MOCK_PAYMENT_WEBHOOK_SECRET ||
  "development-mock-payment-secret"

interface Spies {
  get: jest.SpyInstance
  post: jest.SpyInstance
}

let spy: Spies

beforeEach(() => {
  spy = {
    get: jest
      .spyOn(apiClient, "get")
      .mockResolvedValue({ data: null } as never),
    post: jest
      .spyOn(apiClient, "post")
      .mockResolvedValue({ data: null } as never),
  }
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("paymentService.createIntent", () => {
  it("posts the payment method for the booking", async () => {
    const intent = {
      paymentId: "pay-1",
      bookingId: "booking-1",
      amount: 420,
      status: "PENDING",
    }
    spy.post.mockResolvedValue({ data: intent } as never)

    const result = await paymentService.createIntent("booking-1", "TELEBIRR")

    expect(spy.post).toHaveBeenCalledWith("/payments/booking-1/intent", {
      method: "TELEBIRR",
    })
    expect(result).toEqual(intent)
  })

  it("propagates gateway failures", async () => {
    spy.post.mockRejectedValue(new Error("declined"))

    await expect(
      paymentService.createIntent("booking-1", "CREDIT_CARD"),
    ).rejects.toThrow("declined")
  })
})

describe("paymentService.getMyPayments", () => {
  it("unwraps the payment list", async () => {
    const payload = { data: [{ id: "pay-1", bookingId: "booking-1" }] }
    spy.get.mockResolvedValue({ data: payload } as never)

    const result = await paymentService.getMyPayments()

    expect(spy.get).toHaveBeenCalledWith("/payments/my")
    expect(result).toEqual(payload)
  })
})

describe("paymentService mock gateway callbacks", () => {
  it("defaults to a succeeded callback with the shared secret", async () => {
    await paymentService.mockCallback("booking-1")

    expect(spy.post).toHaveBeenCalledWith(
      "/payments/mock/booking-1",
      { status: "SUCCEEDED" },
      { headers: { "x-mock-payment-secret": DEFAULT_SECRET } },
    )
  })

  it("merges the caller data over the default status", async () => {
    await paymentService.mockCallback("booking-1", {
      reference: "REF-1",
      transactionId: "TX-1",
      status: "FAILED",
    })

    expect(spy.post).toHaveBeenCalledWith(
      "/payments/mock/booking-1",
      { status: "FAILED", reference: "REF-1", transactionId: "TX-1" },
      { headers: { "x-mock-payment-secret": DEFAULT_SECRET } },
    )
  })

  it("accepts an explicit secret", async () => {
    await paymentService.mockCallback("booking-1", undefined, "other-secret")

    expect(spy.post).toHaveBeenCalledWith(
      "/payments/mock/booking-1",
      { status: "SUCCEEDED" },
      { headers: { "x-mock-payment-secret": "other-secret" } },
    )
  })

  it("mirrors the behaviour in mockGatewayCallback", async () => {
    await paymentService.mockGatewayCallback("booking-1", {
      reference: "REF-2",
    })

    expect(spy.post).toHaveBeenCalledWith(
      "/payments/mock/booking-1",
      { status: "SUCCEEDED", reference: "REF-2" },
      { headers: { "x-mock-payment-secret": DEFAULT_SECRET } },
    )
  })

  it("throws in production environment when mock payment is disabled", async () => {
    const env = process.env as Record<string, string | undefined>
    const originalEnv = env.NODE_ENV
    const originalFlag = env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENT
    env.NODE_ENV = "production"
    delete env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENT

    try {
      await expect(
        paymentService.mockCallback("booking-1"),
      ).rejects.toMatchObject({
        name: "ApiError",
        status: 403,
        code: "FORBIDDEN",
      })
      await expect(
        paymentService.mockGatewayCallback("booking-1"),
      ).rejects.toMatchObject({
        name: "ApiError",
        status: 403,
        code: "FORBIDDEN",
      })
    } finally {
      if (originalEnv === undefined) {
        delete env.NODE_ENV
      } else {
        env.NODE_ENV = originalEnv
      }
      if (originalFlag !== undefined) {
        env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENT = originalFlag
      }
    }
  })
})

describe("paymentService refund and cash capture", () => {
  it("requests a refund", async () => {
    spy.post.mockResolvedValue({ data: { status: "REFUNDED" } } as never)

    const result = await paymentService.refundPayment("booking-1")

    expect(spy.post).toHaveBeenCalledWith("/payments/booking-1/refund")
    expect(result).toEqual({ status: "REFUNDED" })
  })

  it("marks a booking as paid in cash", async () => {
    await paymentService.markCashPaid("booking-1", "CASH-1")
    await paymentService.markCashPaid("booking-1")

    expect(spy.post).toHaveBeenNthCalledWith(
      1,
      "/payments/booking-1/cash-paid",
      {
        reference: "CASH-1",
      },
    )
    expect(spy.post).toHaveBeenNthCalledWith(
      2,
      "/payments/booking-1/cash-paid",
      {
        reference: undefined,
      },
    )
  })
})
