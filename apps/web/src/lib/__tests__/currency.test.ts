import {
  USD_TO_ETB_ESTIMATE,
  convertEtbToUsd,
  formatEthiopianBirr,
  formatUSD,
} from "@/lib/currency"

describe("formatUSD", () => {
  it("always renders two decimals", () => {
    expect(formatUSD(5)).toBe("$5.00")
    expect(formatUSD(12.5)).toBe("$12.50")
    expect(formatUSD(0)).toBe("$0.00")
  })

  it("falls back to zero for non-numeric input", () => {
    expect(formatUSD("abc")).toBe("$0.00")
    expect(formatUSD("")).toBe("$0.00")
  })

  it("groups thousands using the active locale", () => {
    expect(formatUSD(1234.5)).toBe(
      `$${(1234.5).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    )
  })
})

describe("formatEthiopianBirr", () => {
  it("prefixes the ETB currency marker", () => {
    expect(formatEthiopianBirr(0)).toBe("ETB 0")
    expect(formatEthiopianBirr(99)).toMatch(/^ETB /)
  })

  it("accepts numeric strings and rejects garbage", () => {
    expect(formatEthiopianBirr("450")).toMatch(/^ETB /)
    expect(formatEthiopianBirr("nope")).toBe("ETB 0")
  })
})

describe("convertEtbToUsd", () => {
  it("uses the default estimate rate", () => {
    expect(USD_TO_ETB_ESTIMATE).toBe(125)
    expect(convertEtbToUsd(125)).toBe(1)
    expect(convertEtbToUsd(1250)).toBe(10)
  })

  it("accepts a custom rate", () => {
    expect(convertEtbToUsd(100, 50)).toBe(2)
  })

  it("rounds to two decimals", () => {
    expect(convertEtbToUsd(100, 300)).toBe(0.33)
  })

  it("treats invalid input as zero", () => {
    expect(convertEtbToUsd("abc")).toBe(0)
  })
})
