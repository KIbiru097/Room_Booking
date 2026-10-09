import { AM_HERITAGE } from "@/lib/heritage-content.am"
import {
  curatedHeritageCityKeys,
  getHeritageContent,
  heritageKey,
  type HeritageCityContent,
} from "@/lib/heritage-content"

const CITY_KEYS = [
  "gondar",
  "aksum",
  "lalibela",
  "harar",
  "addis ababa",
  "bahir dar",
]

describe("heritageKey", () => {
  it("lowercases and trims a city name", () => {
    expect(heritageKey("  Gondar ")).toBe("gondar")
    expect(heritageKey("ADDIS ABABA")).toBe("addis ababa")
  })

  it("keeps an already normalised key", () => {
    expect(heritageKey("lalibela")).toBe("lalibela")
  })

  it("returns null for missing or blank input", () => {
    expect(heritageKey(null)).toBeNull()
    expect(heritageKey(undefined)).toBeNull()
    expect(heritageKey("")).toBeNull()
    expect(heritageKey("   ")).toBeNull()
  })
})

describe("curatedHeritageCityKeys", () => {
  it("lists every curated city", () => {
    expect(curatedHeritageCityKeys()).toEqual(CITY_KEYS)
  })

  it("returns normalised, unique keys", () => {
    const keys = curatedHeritageCityKeys()

    expect(new Set(keys).size).toBe(keys.length)
    for (const key of keys) {
      expect(key).toBe(key.trim().toLowerCase())
      expect(key.length).toBeGreaterThan(0)
    }
  })

  it("has an Amharic patch for every curated city", () => {
    expect(Object.keys(AM_HERITAGE).sort()).toEqual([...CITY_KEYS].sort())
  })
})

describe("getHeritageContent", () => {
  it("returns null for cities without curated content", () => {
    expect(getHeritageContent("Mekelle")).toBeNull()
    expect(getHeritageContent("")).toBeNull()
    expect(getHeritageContent(null)).toBeNull()
    expect(getHeritageContent(undefined)).toBeNull()
  })

  it("matches a city case-insensitively with surrounding whitespace", () => {
    const entry = getHeritageContent("  GONDAR  ")

    expect(entry?.key).toBe("gondar")
    expect(entry?.cityName).toBe("Gondar")
  })

  it("defaults to the English copy", () => {
    expect(getHeritageContent("gondar")).toEqual(
      getHeritageContent("gondar", "en"),
    )
    expect(getHeritageContent("gondar")?.tagline).toContain("castles")
  })

  it("returns fully populated entries for every curated city", () => {
    for (const key of curatedHeritageCityKeys()) {
      const entry = getHeritageContent(key)

      expect(entry).not.toBeNull()
      expect(entry?.timeline.length).toBeGreaterThan(0)
      expect(entry?.stories.length).toBeGreaterThan(0)
      expect(entry?.culture.length).toBeGreaterThan(0)
      expect(entry?.primaryCitation.name.length).toBeGreaterThan(0)
      expect(entry?.fullStory?.lead.length).toBeGreaterThan(0)
      for (const item of entry!.timeline) {
        expect(item.id.length).toBeGreaterThan(0)
        expect(item.citation.name.length).toBeGreaterThan(0)
        expect(item.body.length).toBeGreaterThan(0)
      }
      for (const story of entry!.stories) {
        expect(story.citation.name.length).toBeGreaterThan(0)
      }
    }
  })

  describe("amharic patch", () => {
    it("replaces the translated strings", () => {
      const entry = getHeritageContent("gondar", "am")

      expect(entry?.cityName).toBe("ጎንደር")
      expect(entry?.tagline).toContain("የግንቦች")
      expect(entry?.fullStory?.lead).toContain("ፋሲልዬስ")
      expect(entry?.timeline[0].title).not.toBe(
        getHeritageContent("gondar")?.timeline[0].title,
      )
    })

    it("keeps ids, citations, years and place links from the English base", () => {
      const english = getHeritageContent("gondar") as HeritageCityContent
      const amharic = getHeritageContent("gondar", "am") as HeritageCityContent

      expect(amharic.key).toBe(english.key)
      expect(amharic.timeline.map((t) => t.id)).toEqual(
        english.timeline.map((t) => t.id),
      )
      expect(amharic.timeline.map((t) => t.citation)).toEqual(
        english.timeline.map((t) => t.citation),
      )
      expect(amharic.timeline.map((t) => t.relatedPlaceId)).toEqual(
        english.timeline.map((t) => t.relatedPlaceId),
      )
      expect(amharic.stories.map((s) => s.placeId)).toEqual(
        english.stories.map((s) => s.placeId),
      )
      expect(amharic.fullStory?.keyDates.map((d) => d.year)).toEqual(
        english.fullStory?.keyDates.map((d) => d.year),
      )
      expect(amharic.primaryCitation).toEqual(english.primaryCitation)
    })

    it("patches arrays by index without changing their length", () => {
      for (const key of curatedHeritageCityKeys()) {
        const english = getHeritageContent(key) as HeritageCityContent
        const amharic = getHeritageContent(key, "am") as HeritageCityContent

        expect(amharic.timeline).toHaveLength(english.timeline.length)
        expect(amharic.stories).toHaveLength(english.stories.length)
        expect(amharic.culture).toHaveLength(english.culture.length)
        expect(amharic.cityName).not.toBe(english.cityName)
      }
    })

    it("does not mutate the English base content", () => {
      const english = getHeritageContent("gondar") as HeritageCityContent
      const snapshot = JSON.stringify(english)

      getHeritageContent("gondar", "am")

      expect(JSON.stringify(english)).toBe(snapshot)
      expect(english.cityName).toBe("Gondar")
    })

    it("ignores patch keys that the English content does not define", () => {
      const amharic = getHeritageContent(
        "bahir dar",
        "am",
      ) as HeritageCityContent

      expect(Object.keys(amharic).sort()).toEqual(
        Object.keys(
          getHeritageContent("bahir dar") as HeritageCityContent,
        ).sort(),
      )
      expect(amharic.timeline[0]).not.toHaveProperty("madeUpField")
    })
  })
})

afterEach(() => {
  jest.restoreAllMocks()
})
