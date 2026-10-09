import fs from "node:fs"
import path from "node:path"
import { translationNamespaces } from "@/lib/i18n"

type Locale = "en" | "am"

const LOCALES_ROOT = path.join(__dirname, "..", "..", "locales")

function localePath(locale: Locale, namespace: string) {
  return path.join(LOCALES_ROOT, locale, `${namespace}.json`)
}

function load(locale: Locale, namespace: string): Record<string, string> {
  return JSON.parse(
    fs.readFileSync(localePath(locale, namespace), "utf8"),
  ) as Record<string, string>
}

function filesOnDisk(locale: Locale): string[] {
  return fs
    .readdirSync(path.join(LOCALES_ROOT, locale))
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, ""))
    .sort()
}

describe("translation namespace registry", () => {
  it("lists namespaces without duplicates", () => {
    expect(translationNamespaces.length).toBeGreaterThan(0)
    expect(new Set(translationNamespaces).size).toBe(
      translationNamespaces.length,
    )
  })

  it("covers every locale JSON file on disk", () => {
    expect(filesOnDisk("en")).toEqual([...translationNamespaces].sort())
    expect(filesOnDisk("am")).toEqual([...translationNamespaces].sort())
  })

  it("ships an English and an Amharic file for every namespace", () => {
    for (const namespace of translationNamespaces) {
      expect(fs.existsSync(localePath("en", namespace))).toBe(true)
      expect(fs.existsSync(localePath("am", namespace))).toBe(true)
    }
  })
})

describe("locale namespace parity", () => {
  it.each(translationNamespaces)(
    "%s keeps an identical key set across languages",
    (namespace) => {
      const english = load("en", namespace)
      const amharic = load("am", namespace)

      const missingInAmharic = Object.keys(english).filter(
        (key) => !(key in amharic),
      )
      const extraInAmharic = Object.keys(amharic).filter(
        (key) => !(key in english),
      )

      expect(missingInAmharic).toEqual([])
      expect(extraInAmharic).toEqual([])
      expect(Object.keys(amharic).sort()).toEqual(Object.keys(english).sort())
    },
  )

  it.each(translationNamespaces)(
    "%s provides a non-empty value for every key",
    (namespace) => {
      const english = load("en", namespace)
      const amharic = load("am", namespace)

      const emptyEnglish = Object.keys(english).filter(
        (key) => english[key] === "",
      )
      const emptyAmharic = Object.keys(amharic).filter(
        (key) => amharic[key] === "",
      )

      expect(emptyEnglish).toEqual([])
      expect(emptyAmharic).toEqual([])
    },
  )

  it.each(translationNamespaces)(
    "%s keeps flat string dictionaries",
    (namespace) => {
      const english = load("en", namespace)
      const amharic = load("am", namespace)

      for (const dict of [english, amharic]) {
        for (const [key, value] of Object.entries(dict)) {
          expect(typeof value).toBe("string")
          expect(key.length).toBeGreaterThan(0)
        }
      }
    },
  )
})

afterEach(() => {
  jest.restoreAllMocks()
})
