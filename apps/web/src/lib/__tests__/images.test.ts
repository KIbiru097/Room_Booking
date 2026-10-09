import imageManifest from "@/lib/image-manifest.json"
import { localImage } from "@/lib/images"

const manifestEntries = Object.entries(imageManifest as Record<string, string>)

describe("localImage", () => {
  it("holds a non-empty mirror manifest", () => {
    expect(manifestEntries.length).toBeGreaterThan(0)
  })

  it("rewrites a mirrored third-party URL to its local copy", () => {
    const [remoteUrl, localPath] = manifestEntries[0]

    expect(localImage(remoteUrl)).toBe(localPath)
    expect(localPath.startsWith("/images/mirror/")).toBe(true)
    expect(remoteUrl.startsWith("http")).toBe(true)
  })

  it("rewrites every URL recorded in the manifest", () => {
    for (const [remoteUrl, localPath] of manifestEntries) {
      expect(localImage(remoteUrl)).toBe(localPath)
    }
  })

  it("returns unknown remote URLs unchanged", () => {
    const unknown = "https://example.com/hotel/hero.jpg"

    expect(localImage(unknown)).toBe(unknown)
  })

  it("returns relative API image paths unchanged", () => {
    expect(localImage("/uploads/hotel-1.jpg")).toBe("/uploads/hotel-1.jpg")
  })

  it("returns undefined for empty, null and undefined input", () => {
    expect(localImage("")).toBeUndefined()
    expect(localImage(null)).toBeUndefined()
    expect(localImage(undefined)).toBeUndefined()
  })

  it("exposes the overload that accepts nullish input", () => {
    const maybe: string | null | undefined = null

    const result: string | undefined = localImage(maybe)

    expect(result).toBeUndefined()
  })
})

afterEach(() => {
  jest.restoreAllMocks()
})
