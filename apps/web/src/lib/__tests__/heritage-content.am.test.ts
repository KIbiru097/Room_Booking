import { AM_HERITAGE } from "@/lib/heritage-content.am"
import {
  curatedHeritageCityKeys,
  getHeritageContent,
  type HeritageCityContent,
} from "@/lib/heritage-content"

type PlainObject = Record<string, unknown>

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

interface StringLeaf {
  path: string
  value: string
}

function collectStringLeaves(
  node: unknown,
  path: string,
  out: StringLeaf[] = [],
): StringLeaf[] {
  if (typeof node === "string") {
    out.push({ path, value: node })
    return out
  }
  if (Array.isArray(node)) {
    node.forEach((item, index) =>
      collectStringLeaves(item, `${path}[${index}]`, out),
    )
    return out
  }
  if (isPlainObject(node)) {
    for (const [key, value] of Object.entries(node)) {
      collectStringLeaves(value, path ? `${path}.${key}` : key, out)
    }
  }
  return out
}

function arrayLengths(node: unknown, path = ""): Array<[string, number]> {
  const out: Array<[string, number]> = []
  if (Array.isArray(node)) {
    out.push([path, node.length])
    node.forEach((item, index) =>
      out.push(...arrayLengths(item, `${path}[${index}]`)),
    )
    return out
  }
  if (isPlainObject(node)) {
    for (const [key, value] of Object.entries(node)) {
      out.push(...arrayLengths(value, path ? `${path}.${key}` : key))
    }
  }
  return out
}

const ETHIOPIC = /[\u1200-\u137F]/

describe("AM_HERITAGE patches", () => {
  it("patches exactly the curated cities", () => {
    expect(Object.keys(AM_HERITAGE).sort()).toEqual(
      [...curatedHeritageCityKeys()].sort(),
    )
  })

  it("only overrides fields the English content defines", () => {
    function walk(patch: unknown, english: unknown, path: string) {
      if (Array.isArray(patch)) {
        const base = Array.isArray(english) ? english : []
        patch.forEach((item, index) => {
          if (base[index] !== undefined)
            walk(item, base[index], `${path}[${index}]`)
        })
        return
      }
      if (!isPlainObject(patch)) return

      const baseObject = isPlainObject(english) ? english : null
      expect({ path, isObject: baseObject !== null }).toEqual({
        path,
        isObject: true,
      })
      for (const [key, value] of Object.entries(patch)) {
        expect(Object.keys(baseObject as PlainObject)).toContain(key)
        walk(
          value,
          (baseObject as PlainObject)[key],
          path ? `${path}.${key}` : key,
        )
      }
    }

    for (const [cityKey, patch] of Object.entries(AM_HERITAGE)) {
      walk(patch, getHeritageContent(cityKey), cityKey)
    }
  })

  it("never shortens a patched array relative to the English base", () => {
    for (const [cityKey, patch] of Object.entries(AM_HERITAGE)) {
      const english = getHeritageContent(cityKey) as HeritageCityContent
      const englishLengths = new Map(arrayLengths(english))

      for (const [path, length] of arrayLengths(patch)) {
        expect(length).toBeLessThanOrEqual(englishLengths.get(path) ?? 0)
      }
    }
  })

  it("provides non-empty translated strings", () => {
    for (const leaf of collectStringLeaves(AM_HERITAGE, "")) {
      expect(leaf.value.trim().length).toBeGreaterThan(0)
      expect(leaf.path.length).toBeGreaterThan(0)
    }
  })

  it("writes the headline copy in Ethiopic script", () => {
    for (const [cityKey, patch] of Object.entries(AM_HERITAGE)) {
      expect(patch.cityName).toMatch(ETHIOPIC)
      expect(patch.tagline).toMatch(ETHIOPIC)
      expect(getHeritageContent(cityKey, "am")?.cityName).toMatch(ETHIOPIC)
    }
  })

  it("leaves citations, ids and place links to the English base", () => {
    for (const [cityKey, patch] of Object.entries(AM_HERITAGE)) {
      const patchLeaves = collectStringLeaves(patch, "")
      expect(
        patchLeaves.some((leaf) => leaf.path.endsWith("citation.name")),
      ).toBe(false)
      expect(patchLeaves.some((leaf) => leaf.path.endsWith("placeId"))).toBe(
        false,
      )
      expect(patchLeaves.some((leaf) => leaf.path === "key")).toBe(false)

      const english = getHeritageContent(cityKey) as HeritageCityContent
      const amharic = getHeritageContent(cityKey, "am") as HeritageCityContent
      expect(amharic.primaryCitation).toEqual(english.primaryCitation)
      expect(amharic.stories.map((story) => story.placeId)).toEqual(
        english.stories.map((story) => story.placeId),
      )
    }
  })
})
