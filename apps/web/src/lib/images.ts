import imageManifest from "./image-manifest.json"

const MIRRORED = imageManifest as Record<string, string>

/**
 * Third-party image URLs (Wikimedia, Unsplash) are mirrored into
 * public/images/mirror so the app never depends on those origins at request
 * time. Known URLs are rewritten to the local copy; anything else is returned
 * unchanged so new API images keep working until they are mirrored.
 */
export function localImage(url: string): string
export function localImage(url: string | null | undefined): string | undefined
export function localImage(url?: string | null): string | undefined {
  if (!url) return undefined
  return MIRRORED[url] ?? url
}
