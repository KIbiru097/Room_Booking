import {
  formatCacheAge,
  getCacheScope,
  hasCachedData,
  readCachedValue,
  writeCachedValue,
} from "@/lib/offline-cache"

const PREFIX = "hotel-system:web-cache:"
const SESSION_KEY = "yayetech.session"
const LEGACY_SESSION_KEY = "luxstay.session"

function seedSession(payload: unknown, key = SESSION_KEY) {
  window.localStorage.setItem(
    key,
    typeof payload === "string" ? payload : JSON.stringify(payload),
  )
}

describe("getCacheScope", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("scopes to the signed-in user id", () => {
    seedSession({ user: { id: "user-7", email: "guest@example.com" } })

    expect(getCacheScope()).toBe("user-7")
  })

  it("falls back to the email when the id is missing", () => {
    seedSession({ user: { email: "guest@example.com" } })

    expect(getCacheScope()).toBe("guest@example.com")
  })

  it("falls back to the legacy storage key", () => {
    seedSession({ user: { id: "legacy-user" } }, LEGACY_SESSION_KEY)

    expect(getCacheScope()).toBe("legacy-user")
  })

  it("scopes to anonymous without a session", () => {
    expect(getCacheScope()).toBe("anonymous")
  })

  it("scopes to anonymous when the session JSON is corrupt", () => {
    seedSession("{not-json")

    expect(getCacheScope()).toBe("anonymous")
  })

  it("scopes to anonymous when the session has no user", () => {
    seedSession({ accessToken: "a" })

    expect(getCacheScope()).toBe("anonymous")
  })
})

describe("readCachedValue / writeCachedValue", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("round-trips a value under the namespaced key", () => {
    writeCachedValue("hotels:search", { items: ["a", "b"] })

    expect(window.localStorage.getItem(PREFIX + "hotels:search")).not.toBeNull()

    const cached = readCachedValue<{ items: string[] }>("hotels:search")

    expect(cached?.value).toEqual({ items: ["a", "b"] })
    expect(typeof cached?.savedAt).toBe("number")
  })

  it("records the write timestamp as epoch milliseconds", () => {
    const now = 1_700_000_000_000
    const dateSpy = jest.spyOn(Date, "now").mockReturnValue(now)

    writeCachedValue("rooms", { total: 3 })

    dateSpy.mockRestore()

    expect(readCachedValue<{ total: number }>("rooms")).toEqual({
      value: { total: 3 },
      savedAt: now,
    })
  })

  it("returns null for a missing key", () => {
    expect(readCachedValue("never-written")).toBeNull()
  })

  it("returns null for corrupt JSON", () => {
    window.localStorage.setItem(PREFIX + "broken", "{not-json")

    expect(readCachedValue("broken")).toBeNull()
  })

  it("returns null when savedAt is not a number", () => {
    window.localStorage.setItem(
      PREFIX + "bad-saved-at",
      JSON.stringify({ value: 1, savedAt: "yesterday" }),
    )

    expect(readCachedValue("bad-saved-at")).toBeNull()
  })

  it("returns null when the value field is missing", () => {
    window.localStorage.setItem(
      PREFIX + "no-value",
      JSON.stringify({ savedAt: 123 }),
    )

    expect(readCachedValue("no-value")).toBeNull()
  })

  it("returns null for a JSON null payload", () => {
    window.localStorage.setItem(PREFIX + "null-value", "null")

    expect(readCachedValue("null-value")).toBeNull()
  })

  it("never prefixes keys outside the cache namespace", () => {
    window.localStorage.setItem(
      "other:key",
      JSON.stringify({ value: 1, savedAt: 2 }),
    )

    expect(readCachedValue("other:key")).toBeNull()
    expect(window.localStorage.getItem(PREFIX + "other:key")).toBeNull()
  })

  it("overwrites an existing entry instead of appending", () => {
    writeCachedValue("policy", { version: 1 })
    writeCachedValue("policy", { version: 2 })

    expect(readCachedValue<{ version: number }>("policy")?.value).toEqual({
      version: 2,
    })
    expect(window.localStorage.length).toBe(1)
  })

  it("swallows storage failures without throwing", () => {
    const setItem = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError")
      })

    expect(() => writeCachedValue("full", { a: 1 })).not.toThrow()

    setItem.mockRestore()
  })

  it("survives an unreadable storage entry", () => {
    const getItem = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("SecurityError")
      })

    expect(readCachedValue("unreadable")).toBeNull()

    getItem.mockRestore()
  })
})

describe("hasCachedData", () => {
  beforeEach(() => window.localStorage.clear())

  it("detects a valid cached snapshot", () => {
    expect(hasCachedData()).toBe(false)
    writeCachedValue("trips:list", [{ id: "trip-1" }])
    expect(hasCachedData()).toBe(true)
  })

  it("ignores unrelated storage entries", () => {
    window.localStorage.setItem(
      "other:key",
      JSON.stringify({ value: 1, savedAt: Date.now() }),
    )
    expect(hasCachedData()).toBe(false)
  })
})

describe("formatCacheAge", () => {
  const NOW = 1_700_000_000_000
  let dateSpy: jest.SpyInstance

  beforeEach(() => {
    dateSpy = jest.spyOn(Date, "now").mockReturnValue(NOW)
  })

  afterEach(() => {
    dateSpy.mockRestore()
  })

  it("reads an entry written in the same minute as just now", () => {
    expect(formatCacheAge(NOW)).toBe("just now")
    expect(formatCacheAge(NOW - 59_000)).toBe("just now")
  })

  it("reads minutes up to an hour", () => {
    expect(formatCacheAge(NOW - 5 * 60_000)).toBe("5 min ago")
    expect(formatCacheAge(NOW - 59 * 60_000)).toBe("59 min ago")
  })

  it("reads hours up to a day", () => {
    expect(formatCacheAge(NOW - 60 * 60_000)).toBe("1 hr ago")
    expect(formatCacheAge(NOW - 23 * 60 * 60_000)).toBe("23 hr ago")
  })

  it("reads whole days for older entries", () => {
    expect(formatCacheAge(NOW - 24 * 60 * 60_000)).toBe("1 days ago")
    expect(formatCacheAge(NOW - 72 * 60 * 60_000)).toBe("3 days ago")
  })

  it("clamps timestamps in the future to just now", () => {
    expect(formatCacheAge(NOW + 60 * 60_000)).toBe("just now")
  })
})

afterEach(() => {
  jest.restoreAllMocks()
})
