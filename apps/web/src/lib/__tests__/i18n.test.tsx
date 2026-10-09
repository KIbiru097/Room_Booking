import { act, renderHook } from "@testing-library/react"
import { useLanguage } from "@/lib/i18n"

describe("useLanguage", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = ""
  })

  it("defaults to English", () => {
    const { result } = renderHook(() => useLanguage())

    expect(result.current.language).toBe("en")
    expect(result.current.t("common", "statusConfirmed")).toBe("Confirmed")
  })

  it("interpolates translation params", () => {
    const { result } = renderHook(() => useLanguage())

    expect(result.current.t("account", "welcomeUser", { name: "Abebe" })).toBe(
      "Welcome, Abebe",
    )
    expect(result.current.t("account", "welcomeUser")).toBe("Welcome, {name}")
    expect(result.current.t("account", "welcomeUser", { other: "x" })).toBe(
      "Welcome, {name}",
    )
  })

  it("returns the key and warns when a key is missing", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined)
    const { result } = renderHook(() => useLanguage())

    expect(result.current.t("common", "doesNotExist")).toBe("doesNotExist")
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("doesNotExist"))

    warn.mockRestore()
  })

  it("switches to Amharic and updates the document and storage", () => {
    const { result } = renderHook(() => useLanguage())

    act(() => result.current.setLanguage("am"))

    expect(result.current.language).toBe("am")
    expect(result.current.t("common", "statusConfirmed")).toBe("ተረጋግጧል")
    expect(document.documentElement.lang).toBe("am")
    expect(localStorage.getItem("luxstay_lang")).toBe("am")
  })

  it("restores a stored preference on mount", () => {
    localStorage.setItem("luxstay_lang", "am")

    const { result } = renderHook(() => useLanguage())

    expect(result.current.language).toBe("am")
    expect(document.documentElement.lang).toBe("am")
  })

  it("reacts to languagechange events from other components", () => {
    const { result } = renderHook(() => useLanguage())

    act(() => {
      window.dispatchEvent(new CustomEvent("languagechange", { detail: "am" }))
    })

    expect(result.current.language).toBe("am")
  })
})
