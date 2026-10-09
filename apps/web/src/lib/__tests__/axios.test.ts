import axios, { type AxiosError } from "axios"
import {
  API_BASE_URL,
  ApiError,
  apiClient,
  configureAuthInterceptors,
} from "@/lib/axios"

interface ResponseHandlers {
  fulfilled?: (value: unknown) => unknown
  rejected?: (error: unknown) => unknown
}

interface RequestHandlers {
  fulfilled?: (value: unknown) => unknown
}

function firstRejected(manager: unknown): (error: unknown) => unknown {
  const handlers = (manager as { handlers: Array<ResponseHandlers | null> })
    .handlers
  const handler = handlers.find((entry): entry is ResponseHandlers =>
    Boolean(entry),
  )
  if (!handler?.rejected)
    throw new Error("response error interceptor is not registered")
  return handler.rejected
}

function firstFulfilled(manager: unknown): (value: unknown) => unknown {
  const handlers = (manager as { handlers: Array<RequestHandlers | null> })
    .handlers
  const handler = handlers.find((entry): entry is RequestHandlers =>
    Boolean(entry),
  )
  if (!handler?.fulfilled)
    throw new Error("request interceptor is not registered")
  return handler.fulfilled
}

const runRequestInterceptor = firstFulfilled(apiClient.interceptors.request)
const runResponseError = firstRejected(apiClient.interceptors.response)

interface FakeRequestConfig {
  url?: string
  method?: string
  headers: Record<string, string | undefined>
  [key: string]: unknown
}

function makeConfig(
  config: Partial<FakeRequestConfig> = {},
): FakeRequestConfig {
  return { url: "/resource", method: "get", headers: {}, ...config }
}

function httpError(
  status: number,
  data?: unknown,
  headers: Record<string, string> = {},
  config: FakeRequestConfig = makeConfig(),
): AxiosError {
  return {
    name: "AxiosError",
    config,
    response: { status, data, headers, config },
    isAxiosError: true,
  } as unknown as AxiosError
}

function mapError(error: unknown): Promise<unknown> {
  return Promise.resolve(runResponseError(error))
}

describe("ApiError", () => {
  it("exposes the normalized failure contract", () => {
    const error = new ApiError(
      "Too many requests",
      429,
      "RATE_LIMITED",
      { retry: 1 },
      15,
    )

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe("ApiError")
    expect(error.message).toBe("Too many requests")
    expect(error.status).toBe(429)
    expect(error.code).toBe("RATE_LIMITED")
    expect(error.details).toEqual({ retry: 1 })
    expect(error.retryAfter).toBe(15)
  })

  it("leaves the optional fields undefined by default", () => {
    const error = new ApiError("Boom", 500, "SERVER_ERROR")

    expect(error.details).toBeUndefined()
    expect(error.retryAfter).toBeUndefined()
  })
})

describe("API_BASE_URL", () => {
  it("matches the axios base URL", () => {
    expect(API_BASE_URL).toBe(apiClient.defaults.baseURL)
    expect(API_BASE_URL.endsWith("/")).toBe(false)
    expect(API_BASE_URL).toBe(
      (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(
        /\/$/,
        "",
      ),
    )
  })

  it("configures cookie credentials and a JSON default content type", () => {
    expect(apiClient.defaults.withCredentials).toBe(true)
    expect(apiClient.defaults.timeout).toBe(20000)
    expect(apiClient.defaults.headers["Content-Type"]).toBe("application/json")
  })
})

describe("configureAuthInterceptors / request interceptor", () => {
  afterEach(() => {
    configureAuthInterceptors({
      getAccessToken: () => null,
      getRefreshToken: () => null,
      onTokensRefreshed: () => undefined,
      onAuthFailed: () => undefined,
    })
  })

  it("injects a bearer token from the configured accessor", () => {
    configureAuthInterceptors({
      getAccessToken: () => "access-9",
      getRefreshToken: () => null,
      onTokensRefreshed: () => undefined,
      onAuthFailed: () => undefined,
    })

    const config = runRequestInterceptor(makeConfig()) as FakeRequestConfig

    expect(config.headers.Authorization).toBe("Bearer access-9")
  })

  it("leaves an explicit Authorization header alone", () => {
    configureAuthInterceptors({
      getAccessToken: () => "access-9",
      getRefreshToken: () => null,
      onTokensRefreshed: () => undefined,
      onAuthFailed: () => undefined,
    })

    const config = runRequestInterceptor(
      makeConfig({ headers: { Authorization: "Bearer custom" } }),
    ) as FakeRequestConfig

    expect(config.headers.Authorization).toBe("Bearer custom")
  })

  it("adds no Authorization header without a token", () => {
    const config = runRequestInterceptor(makeConfig()) as FakeRequestConfig

    expect(config.headers.Authorization).toBeUndefined()
  })

  it.each(["post", "patch", "put", "delete"])(
    "adds an idempotency key to %s requests",
    (method) => {
      const config = runRequestInterceptor(
        makeConfig({ method }),
      ) as FakeRequestConfig

      expect(typeof config.headers["Idempotency-Key"]).toBe("string")
      expect(
        (config.headers["Idempotency-Key"] as string).length,
      ).toBeGreaterThan(0)
    },
  )

  it("does not add an idempotency key to GET requests", () => {
    const config = runRequestInterceptor(
      makeConfig({ method: "get" }),
    ) as FakeRequestConfig

    expect(config.headers["Idempotency-Key"]).toBeUndefined()
  })

  it("keeps a caller supplied idempotency key", () => {
    const config = runRequestInterceptor(
      makeConfig({
        method: "post",
        headers: { "Idempotency-Key": "fixed-key" },
      }),
    ) as FakeRequestConfig

    expect(config.headers["Idempotency-Key"]).toBe("fixed-key")
  })

  it("falls back to a generated key when crypto.randomUUID is unavailable", () => {
    Reflect.set(crypto, "randomUUID", undefined)

    try {
      const config = runRequestInterceptor(
        makeConfig({ method: "post" }),
      ) as FakeRequestConfig

      expect(String(config.headers["Idempotency-Key"])).toMatch(
        /^yayetech-\d+-[a-z0-9]+$/,
      )
    } finally {
      Reflect.deleteProperty(crypto, "randomUUID")
    }
  })
})

describe("network and timeout normalization", () => {
  it("maps an unreachable server onto a NETWORK_ERROR", async () => {
    await expect(
      mapError({
        name: "AxiosError",
        config: makeConfig({ url: "/bookings" }),
      }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
      code: "NETWORK_ERROR",
      message: `Unable to connect to the hotel system server at ${API_BASE_URL}.`,
    })
  })

  it("maps a timeout onto a NETWORK_ERROR with a timeout message", async () => {
    await expect(
      mapError({
        name: "AxiosError",
        code: "ECONNABORTED",
        config: makeConfig({ url: "/bookings" }),
      }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
      code: "NETWORK_ERROR",
      message:
        "The request timed out. Please check your connection and try again.",
    })
  })
})

describe("HTTP status normalization", () => {
  it("maps 400 to a validation error", async () => {
    await expect(mapError(httpError(400))).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Please correct the highlighted input errors.",
    })
  })

  it("prefers the API message and details for a 400", async () => {
    await expect(
      mapError(
        httpError(400, {
          error: {
            message: "Email is already registered",
            details: { email: ["taken"] },
          },
        }),
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Email is already registered",
      details: { email: ["taken"] },
    })
  })

  it("maps 403 to a permission error", async () => {
    await expect(mapError(httpError(403))).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    })
  })

  it("maps 404 to a not found error", async () => {
    await expect(mapError(httpError(404))).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
      message: "The requested resource could not be found.",
    })
  })

  it("maps 409 to the sold-out conflict message", async () => {
    await expect(mapError(httpError(409))).rejects.toMatchObject({
      status: 409,
      code: "CONFLICT",
      message:
        "This room is no longer available for the selected dates. Please select alternative dates or rooms.",
    })
  })

  it("maps 429 using the Retry-After header", async () => {
    await expect(
      mapError(httpError(429, undefined, { "retry-after": "12" })),
    ).rejects.toMatchObject({
      status: 429,
      code: "RATE_LIMITED",
      retryAfter: 12,
      message: "Too many requests. Please wait 12 seconds before trying again.",
    })
  })

  it("assumes a sixty second cool down when Retry-After is missing", async () => {
    await expect(mapError(httpError(429))).rejects.toMatchObject({
      code: "RATE_LIMITED",
      retryAfter: 60,
      message: "Too many requests. Please wait 60 seconds before trying again.",
    })
  })

  it.each([500, 502, 503, 504])("maps %s to a server error", async (status) => {
    await expect(mapError(httpError(status))).rejects.toMatchObject({
      status,
      code: "SERVER_ERROR",
      message:
        "The server encountered an error processing your request. Please try again later.",
    })
  })

  it("falls back to an unknown error for unmatched statuses", async () => {
    await expect(mapError(httpError(418))).rejects.toMatchObject({
      status: 418,
      code: "UNKNOWN_ERROR",
      message: "An unexpected error occurred. Please try again.",
    })
  })

  it("joins array messages and forwards validation issues", async () => {
    await expect(
      mapError(
        httpError(400, {
          message: ["check-in required", "check-out required"],
          issues: [1, 2],
        }),
      ),
    ).rejects.toMatchObject({
      message: "check-in required, check-out required",
      details: [1, 2],
    })
  })
})

describe("401 handling", () => {
  const originalAdapter = apiClient.defaults.adapter

  function configureTokens(refreshToken: string | null) {
    configureAuthInterceptors({
      getAccessToken: () => null,
      getRefreshToken: () => refreshToken,
      onTokensRefreshed: jest.fn(),
      onAuthFailed: jest.fn(),
    })
  }

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
    configureAuthInterceptors({
      getAccessToken: () => null,
      getRefreshToken: () => null,
      onTokensRefreshed: () => undefined,
      onAuthFailed: () => undefined,
    })
    jest.restoreAllMocks()
  })

  it("calls onAuthFailed when no refresh token is available", async () => {
    const onAuthFailed = jest.fn()
    configureAuthInterceptors({
      getAccessToken: () => null,
      getRefreshToken: () => null,
      onTokensRefreshed: () => undefined,
      onAuthFailed,
    })

    await expect(
      mapError(httpError(401, undefined, {}, makeConfig({ url: "/auth/me" }))),
    ).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Session expired. Please sign in again.",
    })
    expect(onAuthFailed).toHaveBeenCalledTimes(1)
  })

  it("skips refreshing for the login endpoint and maps the status instead", async () => {
    configureTokens("refresh-1")

    await expect(
      mapError(
        httpError(
          401,
          undefined,
          {},
          makeConfig({ url: "/auth/login", method: "post" }),
        ),
      ),
    ).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Please sign in to access this resource.",
    })
  })

  it("does not retry a request that already went through refresh", async () => {
    configureTokens("refresh-1")
    const refreshSpy = jest.spyOn(axios, "post")

    await expect(
      mapError(
        httpError(
          401,
          undefined,
          {},
          makeConfig({ url: "/bookings", headers: {}, _retry: true }),
        ),
      ),
    ).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Please sign in to access this resource.",
    })
    expect(refreshSpy).not.toHaveBeenCalled()
  })

  it("refreshes, notifies the store and replays the request", async () => {
    const refreshSpy = jest.spyOn(axios, "post").mockResolvedValue({
      data: { accessToken: "new-access", refreshToken: "new-refresh" },
    } as never)
    const onTokensRefreshed = jest.fn()
    const onAuthFailed = jest.fn()
    configureAuthInterceptors({
      getAccessToken: () => null,
      getRefreshToken: () => "refresh-1",
      onTokensRefreshed,
      onAuthFailed,
    })
    const adapter = jest.fn(async (config: { headers?: unknown }) => ({
      data: { ok: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }))
    apiClient.defaults.adapter = (adapter as never)

    const result = await mapError(
      httpError(
        401,
        undefined,
        {},
        makeConfig({ url: "/bookings/my", headers: {} }),
      ),
    )

    expect(refreshSpy).toHaveBeenCalledWith(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: "refresh-1",
    })
    expect(onTokensRefreshed).toHaveBeenCalledWith("new-access", "new-refresh")
    expect(onAuthFailed).not.toHaveBeenCalled()
    expect(adapter).toHaveBeenCalledTimes(1)

    const replayHeaders = adapter.mock.calls[0][0].headers as {
      get?: (name: string) => unknown
      Authorization?: unknown
    }
    const authorization =
      typeof replayHeaders.get === "function"
        ? replayHeaders.get("Authorization")
        : replayHeaders.Authorization
    expect(authorization).toBe("Bearer new-access")
    expect(result).toMatchObject({ status: 200, data: { ok: true } })
  })

  it("fails the request and logs the user out when refreshing fails", async () => {
    jest
      .spyOn(axios, "post")
      .mockRejectedValue(new Error("refresh endpoint down"))
    const onAuthFailed = jest.fn()
    configureAuthInterceptors({
      getAccessToken: () => null,
      getRefreshToken: () => "refresh-1",
      onTokensRefreshed: () => undefined,
      onAuthFailed,
    })

    await expect(
      mapError(
        httpError(
          401,
          undefined,
          {},
          makeConfig({ url: "/bookings/my", headers: {} }),
        ),
      ),
    ).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Your session has expired. Please sign in again.",
    })
    expect(onAuthFailed).toHaveBeenCalledTimes(1)
  })

  it("queues concurrent 401s behind a single refresh", async () => {
    configureAuthInterceptors({
      getAccessToken: () => null,
      getRefreshToken: () => "refresh-1",
      onTokensRefreshed: jest.fn(),
      onAuthFailed: jest.fn(),
    })

    let resolveRefresh: (value: unknown) => void = () => undefined
    const refreshResult = new Promise((resolve) => {
      resolveRefresh = resolve
    })
    const refreshSpy = jest
      .spyOn(axios, "post")
      .mockImplementation(() => refreshResult as never)

    const adapter = jest.fn(async (config: { headers?: unknown }) => ({
      data: { ok: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }))
    apiClient.defaults.adapter = (adapter as never)

    const first = mapError(
      httpError(
        401,
        undefined,
        {},
        makeConfig({ url: "/bookings/my", headers: {} }),
      ),
    )
    const second = mapError(
      httpError(
        401,
        undefined,
        {},
        makeConfig({ url: "/payments/my", headers: {} }),
      ),
    )

    expect(refreshSpy).toHaveBeenCalledTimes(1)

    resolveRefresh({
      data: { accessToken: "rotated", refreshToken: "rotated-refresh" },
    })

    await expect(first).resolves.toMatchObject({ status: 200 })
    await expect(second).resolves.toMatchObject({ status: 200 })
    expect(adapter).toHaveBeenCalledTimes(2)
    expect(refreshSpy).toHaveBeenCalledTimes(1)
  })
})
