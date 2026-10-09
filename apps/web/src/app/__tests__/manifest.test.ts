import manifest from "@/app/manifest"

describe("app manifest", () => {
  const result = manifest()

  it("declares the app identity", () => {
    expect(result.name).toBe("LuxStay — Curated Stays & Grand Resorts")
    expect(result.short_name).toBe("LuxStay")
    expect(result.description).toContain(
      "Ethiopian places, heritage, and culture",
    )
  })

  it("scopes the installed app to the site root", () => {
    expect(result.start_url).toBe("/")
    expect(result.scope).toBe("/")
    expect(result.display).toBe("standalone")
    expect(result.orientation).toBe("portrait-primary")
  })

  it("exposes the brand colours", () => {
    expect(result.background_color).toBe("#f3efe5")
    expect(result.theme_color).toBe("#0b1528")
  })

  it("ships a scalable and a maskable icon", () => {
    expect(result.icons).toHaveLength(2)

    const [any, maskable] = result.icons ?? []
    expect(any).toMatchObject({
      src: "/icons/luxstay-192.svg",
      sizes: "192x192",
      type: "image/svg+xml",
      purpose: "any",
    })
    expect(maskable).toMatchObject({
      src: "/icons/luxstay-512.svg",
      sizes: "512x512",
      purpose: "maskable",
    })
  })
})
