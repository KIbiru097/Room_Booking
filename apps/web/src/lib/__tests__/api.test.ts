import { API_BASE_URL, ApiError, api } from "@/lib/api"

const SESSION_KEY = "yayetech.session"
const LEGACY_SESSION_KEY = "luxstay.session"

const fetchMock = jest.fn()

interface FakeResponseOptions {
  status?: number
  body?: unknown
  headers?: Record<string, string>
}

function fakeResponse({
  status = 200,
  body = "",
  headers = {},
}: FakeResponseOptions = {}): Response {
  const text = typeof body === "string" ? body : JSON.stringify(body)
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) =>
        headers[name] ?? headers[name.toLowerCase()] ?? null,
    },
    text: async () => text,
    json: async () => JSON.parse(text),
  } as unknown as Response
}

function lastFetchArgs(): [unknown, RequestInit] {
  const calls = fetchMock.mock.calls as Array<[unknown, RequestInit]>
  return calls[calls.length - 1]
}

function headersAt(index: number): Record<string, string> {
  return (fetchMock.mock.calls[index][1] as RequestInit)
    .headers as Record<string, string>
}

beforeEach(() => {
  window.localStorage.clear()
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(fakeResponse({ body: {} }))
  Reflect.set(globalThis, "fetch", fetchMock)
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
  Reflect.deleteProperty(globalThis, "fetch")
})

describe("API_BASE_URL", () => {
  it("never ends with a slash", () => {
    expect(API_BASE_URL).toBe(
      (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(
        /\/$/,
        "",
      ),
    )
    expect(API_BASE_URL.endsWith("/")).toBe(false)
  })

  it("strips a trailing slash from a configured base URL", () => {
    const original = process.env.NEXT_PUBLIC_API_URL
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.test/"
    jest.resetModules()

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fresh = require("@/lib/api") as { API_BASE_URL: string }

    try {
      expect(fresh.API_BASE_URL).toBe("https://api.example.test")
    } finally {
      if (original === undefined) {
        delete process.env.NEXT_PUBLIC_API_URL
      } else {
        process.env.NEXT_PUBLIC_API_URL = original
      }
    }
  })
})

describe("ApiError", () => {
  it("carries the HTTP status, code and details", () => {
    const error = new ApiError("Room unavailable", 409, "CONFLICT", {
      roomIds: ["r1"],
    })

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe("ApiError")
    expect(error.message).toBe("Room unavailable")
    expect(error.status).toBe(409)
    expect(error.code).toBe("CONFLICT")
    expect(error.details).toEqual({ roomIds: ["r1"] })
  })

  it("leaves the optional fields undefined", () => {
    const error = new ApiError("Boom", 500)

    expect(error.code).toBeUndefined()
    expect(error.details).toBeUndefined()
  })
})

describe("request construction", () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue(fakeResponse({ body: {} }))
  })

  it("issues a GET without a body or content type", async () => {
    await api.get("/catalog/hotels")

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/catalog/hotels`, {
      method: "GET",
      headers: {},
      credentials: "include",
    })
  })

  it("attaches a bearer token when one is supplied", async () => {
    await api.get("/auth/me", "token-1")

    expect(headersAt(0)).toEqual({ Authorization: "Bearer token-1" })
  })

  it("merges caller supplied headers", async () => {
    await api.get("/x", undefined, { headers: { "X-Trace": "abc" } })

    expect(headersAt(0)).toMatchObject({ "X-Trace": "abc" })
  })

  it("serialises JSON bodies with a content type header", async () => {
    await api.post("/auth/login", { email: "guest@example.com" })

    const [url, init] = lastFetchArgs()
    expect(url).toBe(`${API_BASE_URL}/auth/login`)
    expect(init.method).toBe("POST")
    expect(init.body).toBe('{"email":"guest@example.com"}')
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" })
    expect(init.credentials).toBe("include")
  })

  it("omits the content type when there is no body", async () => {
    await api.post("/bookings/b1/cancel")

    expect(lastFetchArgs()[1].headers).not.toHaveProperty("Content-Type")
  })

  it.each([
    ["POST", () => api.post("/resource")],
    ["PATCH", () => api.patch("/resource")],
    ["PUT", () => api.put("/resource")],
    ["DELETE", () => api.delete("/resource")],
  ] as const)(
    "%s requests carry an idempotency key",
    async (_method, invoke) => {
      await invoke()

      const key = headersAt(0)["Idempotency-Key"]
      expect(typeof key).toBe("string")
      expect(key.length).toBeGreaterThan(0)
    },
  )

  it("keeps an explicit idempotency key", async () => {
    await api.post("/bookings", { hotelId: "h1" }, undefined, {
      idempotencyKey: "idem-42",
    })

    expect(headersAt(0)["Idempotency-Key"]).toBe("idem-42")
  })

  it("never adds an idempotency key to GET requests", async () => {
    await api.get("/catalog/hotels")

    expect(headersAt(0)).not.toHaveProperty("Idempotency-Key")
  })

  it("sends FormData untouched so the browser can set its boundary", async () => {
    const form = new FormData()
    form.append("photo", "blob-1")

    await api.postForm("/auth/me/photo", form, "token-1")

    const [url, init] = lastFetchArgs()
    expect(url).toBe(`${API_BASE_URL}/auth/me/photo`)
    expect(init.body).toBe(form)
    expect(init.body).toBeInstanceOf(FormData)
    expect(init.headers).toEqual({
      Authorization: "Bearer token-1",
      "Idempotency-Key": expect.any(String),
    })
  })

  it("routes the verb helpers to their HTTP methods", async () => {
    await api.put("/catalog/hotels/h1/policy", { checkIn: "14:00" })
    expect(lastFetchArgs()[1].method).toBe("PUT")

    await api.patch("/catalog/rooms/r1", { price: 100 })
    expect(lastFetchArgs()[1].method).toBe("PATCH")

    await api.delete("/reviews/r1", "token-1")
    expect(lastFetchArgs()[1].method).toBe("DELETE")
    expect(lastFetchArgs()[1].headers).toMatchObject({
      Authorization: "Bearer token-1",
    })
  })
})

describe("response handling", () => {
  it("resolves parsed JSON payloads", async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: { items: [1, 2] } }))

    await expect(api.get<{ items: number[] }>("/bookings/my")).resolves.toEqual(
      { items: [1, 2] },
    )
  })

  it("returns non-JSON bodies as text", async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: "plain text" }))

    await expect(api.get<string>("/health")).resolves.toBe("plain text")
  })
})

describe("error mapping", () => {
  it("maps a nested error object onto ApiError", async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({
        status: 400,
        body: {
          error: {
            message: "Validation failed",
            code: "VALIDATION_ERROR",
            details: { email: ["must be an email"] },
          },
        },
      }),
    )

    await expect(api.post("/auth/register", {})).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: { email: ["must be an email"] },
    })
  })

  it("joins array messages with commas", async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({
        status: 400,
        body: { message: ["check-in is required", "check-out is required"] },
      }),
    )

    await expect(api.post("/bookings", {})).rejects.toMatchObject({
      message: "check-in is required, check-out is required",
    })
  })

  it("uses a plain text body as the message", async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({ status: 500, body: "backend exploded" }),
    )

    await expect(api.get("/x")).rejects.toMatchObject({
      status: 500,
      message: "backend exploded",
    })
  })

  it("falls back to a status message when the body is empty", async () => {
    fetchMock.mockResolvedValue(fakeResponse({ status: 502, body: "" }))

    await expect(api.get("/x")).rejects.toMatchObject({
      status: 502,
      message: "Request failed (502)",
    })
  })

  it("strips framework stack noise out of the message", async () => {
    const noisy = [
      "PrismaClientKnownRequestError:",
      "Invalid `findMany()` invocation",
      "123 internal helper line",
      "→ Record to find does not exist.",
      "Only the real failure matters.",
    ].join("\n")
    fetchMock.mockResolvedValue(
      fakeResponse({ status: 500, body: { message: noisy } }),
    )

    await expect(api.get("/x")).rejects.toMatchObject({
      status: 500,
      message: "Only the real failure matters.",
    })
  })

  it("falls back to a generic message when every line is noise", async () => {
    const noiseOnly = [
      "Invalid `update()` invocation",
      "invocation in schema.prisma",
      "→ Unique constraint failed",
    ].join("\n")
    fetchMock.mockResolvedValue(
      fakeResponse({ status: 500, body: { message: noiseOnly } }),
    )

    await expect(api.get("/x")).rejects.toMatchObject({
      message: "An unexpected error occurred. Please try again.",
    })
  })

  it("propagates the HTTP status of a failed request", async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({ status: 404, body: { message: "Hotel not found" } }),
    )

    await expect(api.get("/catalog/hotels/missing")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "Hotel not found",
    })
  })
})

describe("network failures", () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it("reports an unreachable API as a NETWORK_ERROR", async () => {
    fetchMock.mockRejectedValue(new Error("offline"))

    await expect(
      api.get("/x", undefined, { retries: 0 }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
      code: "NETWORK_ERROR",
      message: expect.stringContaining(API_BASE_URL),
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("never retries mutating requests", async () => {
    fetchMock.mockRejectedValue(new Error("offline"))

    await expect(
      api.post("/bookings", { hotelId: "h1" }),
    ).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("retries a failing GET twice before giving up", async () => {
    jest.useFakeTimers()
    fetchMock.mockRejectedValue(new Error("offline"))

    const promise = api.get("/catalog/hotels")
    const outcome = expect(promise).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    })
    await jest.runAllTimersAsync()

    await outcome
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})

describe("transient status retries", () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it("retries a 429 after the Retry-After delay", async () => {
    jest.useFakeTimers()
    fetchMock
      .mockResolvedValueOnce(
        fakeResponse({ status: 429, headers: { "Retry-After": "1" } }),
      )
      .mockResolvedValueOnce(fakeResponse({ body: { ok: true } }))

    const promise = api.get("/catalog/hotels")
    await jest.advanceTimersByTimeAsync(600)

    await expect(promise).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("retries a 503 and then succeeds", async () => {
    jest.useFakeTimers()
    fetchMock
      .mockResolvedValueOnce(fakeResponse({ status: 503 }))
      .mockResolvedValueOnce(fakeResponse({ body: { ok: true } }))

    const promise = api.get("/x")
    await jest.runAllTimersAsync()

    await expect(promise).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("surfaces the last status once retries are exhausted", async () => {
    jest.useFakeTimers()
    fetchMock.mockResolvedValue(
      fakeResponse({ status: 502, body: { message: "bad gateway" } }),
    )

    const promise = api.get("/x")
    const outcome = expect(promise).rejects.toMatchObject({
      status: 502,
      message: "bad gateway",
    })
    await jest.runAllTimersAsync()

    await outcome
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})

describe("401 token refresh", () => {
  function seedSession(legacy = false) {
    window.localStorage.setItem(
      legacy ? LEGACY_SESSION_KEY : SESSION_KEY,
      JSON.stringify({
        accessToken: "old-access",
        refreshToken: "old-refresh",
        tokens: { accessToken: "old-access", refreshToken: "old-refresh" },
        user: { id: "user-1" },
      }),
    )
  }

  it("refreshes and replays the original request", async () => {
    seedSession()
    fetchMock
      .mockResolvedValueOnce(
        fakeResponse({ status: 401, body: { message: "expired" } }),
      )
      .mockResolvedValueOnce(
        fakeResponse({
          body: { accessToken: "new-access", refreshToken: "new-refresh" },
        }),
      )
      .mockResolvedValueOnce(fakeResponse({ body: { ok: true } }))

    await expect(api.get("/bookings/my", "old-access")).resolves.toEqual({
      ok: true,
    })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1][0]).toBe(`${API_BASE_URL}/auth/refresh`)
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({
      refreshToken: "old-refresh",
    })

    const replayHeaders = headersAt(2)
    expect(replayHeaders.Authorization).toBe("Bearer new-access")
    expect(replayHeaders).not.toHaveProperty("Idempotency-Key")

    const stored = JSON.parse(
      window.localStorage.getItem(SESSION_KEY) as string,
    )
    expect(stored.accessToken).toBe("new-access")
    expect(stored.refreshToken).toBe("new-refresh")
    expect(stored.tokens).toEqual({
      accessToken: "new-access",
      refreshToken: "new-refresh",
    })
  })

  it("reads the refresh token from the legacy storage key", async () => {
    seedSession(true)
    fetchMock
      .mockResolvedValueOnce(
        fakeResponse({ status: 401, body: { message: "expired" } }),
      )
      .mockResolvedValueOnce(
        fakeResponse({ body: { accessToken: "a2", refreshToken: "r2" } }),
      )
      .mockResolvedValueOnce(fakeResponse({ body: { ok: true } }))

    await expect(api.get("/auth/me")).resolves.toEqual({ ok: true })

    const stored = JSON.parse(
      window.localStorage.getItem(LEGACY_SESSION_KEY) as string,
    )
    expect(stored.accessToken).toBe("a2")
    expect(stored.tokens.accessToken).toBe("a2")
  })

  it("fails fast when no refresh token is stored", async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({ status: 401, body: { message: "expired" } }),
    )

    await expect(api.get("/x")).rejects.toMatchObject({
      status: 401,
      message: "expired",
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("honours the skipRefresh option", async () => {
    seedSession()
    fetchMock.mockResolvedValue(
      fakeResponse({ status: 401, body: { message: "expired" } }),
    )

    await expect(
      api.get("/x", "old-access", { skipRefresh: true }),
    ).rejects.toMatchObject({
      status: 401,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("never refreshes when the login request itself is rejected", async () => {
    seedSession()
    fetchMock.mockResolvedValue(
      fakeResponse({ status: 401, body: { message: "Bad credentials" } }),
    )

    await expect(
      api.post("/auth/login", { email: "a@b.com" }),
    ).rejects.toMatchObject({
      status: 401,
      message: "Bad credentials",
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("clears the legacy session and reports the failure when refreshing fails", async () => {
    seedSession(true)
    fetchMock
      .mockResolvedValueOnce(
        fakeResponse({ status: 401, body: { message: "expired" } }),
      )
      .mockResolvedValueOnce(
        fakeResponse({ status: 500, body: { message: "refresh failed" } }),
      )

    await expect(api.get("/x")).rejects.toMatchObject({
      status: 401,
      message: "expired",
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(window.localStorage.getItem(LEGACY_SESSION_KEY)).toBeNull()
  })

  it("shares a single refresh between concurrent 401s", async () => {
    seedSession()
    const seen = new Set<string>()
    let resolveRefresh: (response: Response) => void = () => undefined
    const refreshResponse = new Promise<Response>((resolve) => {
      resolveRefresh = resolve
    })

    fetchMock.mockImplementation((input: unknown) => {
      const url = String(input)
      if (url.endsWith("/auth/refresh")) return refreshResponse
      if (!seen.has(url)) {
        seen.add(url)
        return Promise.resolve(
          fakeResponse({ status: 401, body: { message: "expired" } }),
        )
      }
      return Promise.resolve(fakeResponse({ body: { ok: true } }))
    })

    const first = api.get("/first")
    const second = api.get("/second")

    for (
      let i = 0;
      i < 20 &&
      !fetchMock.mock.calls.some(([url]) =>
        String(url).endsWith("/auth/refresh"),
      );
      i += 1
    ) {
      await Promise.resolve()
    }
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        String(url).endsWith("/auth/refresh"),
      ),
    ).toHaveLength(1)

    resolveRefresh(
      fakeResponse({
        body: { accessToken: "rotated", refreshToken: "rotated-r" },
      }),
    )

    await expect(first).resolves.toEqual({ ok: true })
    await expect(second).resolves.toEqual({ ok: true })

    const targetCalls = fetchMock.mock.calls.filter(
      ([url]) =>
        String(url).endsWith("/first") || String(url).endsWith("/second"),
    )
    expect(targetCalls).toHaveLength(4)
    for (const [, init] of targetCalls.slice(2)) {
      expect((init.headers as Record<string, string>).Authorization).toBe(
        "Bearer rotated",
      )
    }
    expect(window.localStorage.getItem(SESSION_KEY)).toContain("rotated")
  })
})
