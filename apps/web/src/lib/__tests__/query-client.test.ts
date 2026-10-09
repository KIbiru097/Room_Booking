import {
  CACHE_POLICIES,
  getQueryClient,
  makeQueryClient,
} from "@/lib/query-client"

type RetryFn = (failureCount: number, error: { status?: number }) => boolean

describe("makeQueryClient", () => {
  it("applies the moderate default cache windows", () => {
    const client = makeQueryClient()
    const queries = client.getDefaultOptions().queries

    expect(queries?.staleTime).toBe(1000 * 60 * 2)
    expect(queries?.gcTime).toBe(1000 * 60 * 15)
    expect(queries?.refetchOnWindowFocus).toBe(false)
    expect(queries?.refetchOnReconnect).toBe(true)
  })

  it("never retries mutations", () => {
    expect(makeQueryClient().getDefaultOptions().mutations?.retry).toBe(false)
  })

  it("builds a fresh client on every call", () => {
    expect(makeQueryClient()).not.toBe(makeQueryClient())
  })

  describe("query retry policy", () => {
    const retry = makeQueryClient().getDefaultOptions().queries
      ?.retry as RetryFn

    it("gives up immediately on client 4xx errors", () => {
      expect(retry(0, { status: 400 })).toBe(false)
      expect(retry(1, { status: 401 })).toBe(false)
      expect(retry(2, { status: 404 })).toBe(false)
      expect(retry(0, { status: 409 })).toBe(false)
    })

    it("retries server errors and network failures twice at most", () => {
      expect(retry(0, { status: 500 })).toBe(true)
      expect(retry(1, { status: 503 })).toBe(true)
      expect(retry(2, { status: 500 })).toBe(false)
      expect(retry(3, { status: 500 })).toBe(false)
    })

    it("treats an error without a status as retryable within the budget", () => {
      expect(retry(0, {})).toBe(true)
      expect(retry(1, {})).toBe(true)
      expect(retry(2, {})).toBe(false)
    })
  })
})

describe("getQueryClient", () => {
  it("returns one shared browser client across calls", () => {
    const first = getQueryClient()
    const second = getQueryClient()

    expect(first).toBe(second)
    expect(first).not.toBe(makeQueryClient())
    expect(first.getDefaultOptions().queries?.staleTime).toBe(1000 * 60 * 2)
  })
})

describe("CACHE_POLICIES", () => {
  it("keeps availability entries almost always fresh", () => {
    expect(CACHE_POLICIES.AVAILABILITY.staleTime).toBe(1000 * 20)
    expect(CACHE_POLICIES.AVAILABILITY.refetchOnWindowFocus).toBe(true)
  })

  it("holds hotel details for five minutes without focus refetch", () => {
    expect(CACHE_POLICIES.HOTEL_DETAILS.staleTime).toBe(1000 * 60 * 5)
    expect(CACHE_POLICIES.HOTEL_DETAILS.refetchOnWindowFocus).toBe(false)
  })

  it("holds static catalogs for thirty minutes", () => {
    expect(CACHE_POLICIES.STATIC_CATALOG.staleTime).toBe(1000 * 60 * 30)
    expect(CACHE_POLICIES.STATIC_CATALOG.refetchOnWindowFocus).toBe(false)
  })

  it("polls dashboard KPIs every thirty seconds", () => {
    expect(CACHE_POLICIES.DASHBOARD_STATS.staleTime).toBe(1000 * 30)
    expect(CACHE_POLICIES.DASHBOARD_STATS.refetchInterval).toBe(1000 * 30)
  })

  it("exposes exactly the four documented resource policies", () => {
    expect(Object.keys(CACHE_POLICIES).sort()).toEqual([
      "AVAILABILITY",
      "DASHBOARD_STATS",
      "HOTEL_DETAILS",
      "STATIC_CATALOG",
    ])
  })
})

afterEach(() => {
  jest.restoreAllMocks()
})
