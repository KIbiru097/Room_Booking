import DiscoverView from "./DiscoverView"
import type { DestinationItem, PlaceItem } from "@/lib/services"

export const revalidate = 300

export const metadata = {
  title: "Discover Ethiopia",
  description:
    "Explore Ethiopia with LuxStay — curated destinations, heritage sites, places to eat, and city guides across Addis Ababa, Gondar, Lalibela, Bahir Dar, Harar and Aksum.",
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/$/, "")

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export default async function DiscoverPage() {
  const [destinations, nearby] = await Promise.all([
    getJson<DestinationItem[]>("/discover/destinations?limit=50"),
    getJson<{ data: PlaceItem[] }>(
      "/discover/nearby?lat=9.0105&lng=38.7612&radiusKm=10&limit=50",
    ),
  ])

  return (
    <DiscoverView
      initialDestinations={destinations ?? []}
      initialPlaces={nearby?.data ?? []}
    />
  )
}
