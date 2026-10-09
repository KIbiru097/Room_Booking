"use client" /* Map */ /* Nearby panel */

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  Compass,
  Building2,
  Landmark,
  UtensilsCrossed,
  Coffee,
  HeartPulse,
  Landmark as BankIcon,
  Backpack,
  Navigation,
  Crosshair,
} from "lucide-react"
import { discoverApi, type PlaceItem } from "@/lib/services"
import { Skeleton } from "@/components/ui/Skeleton"

const HeritageMap = dynamic(() => import("@/app/discover/HeritageMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-500">
      Loading map…
    </div>
  ),
})

const FILTERS = [
  { id: "all", label: "All", icon: Compass },
  { id: "HOTEL", label: "Hotels", icon: Building2 },
  { id: "HERITAGE", label: "Heritage", icon: Landmark },
  { id: "RESTAURANT", label: "Restaurants", icon: UtensilsCrossed },
  { id: "CAFE", label: "Coffee", icon: Coffee },
  { id: "PHARMACY", label: "Pharmacy", icon: HeartPulse },
  { id: "BANK", label: "Banks", icon: BankIcon },
  { id: "ATTRACTION", label: "Experiences", icon: Backpack },
]

const RADII = [1, 5, 10, 15]
const ADDIS_CENTER = { lat: 9.0105, lng: 38.7612 }

export default function MapDiscovery() {
  const [filter, setFilter] = useState("all")
  const [radius, setRadius] = useState(10)
  const [places, setPlaces] = useState<PlaceItem[] | null>(null)
  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    const center = userLocation ?? ADDIS_CENTER
    setPlaces(null)
    discoverApi
      .nearby({ lat: center.lat, lng: center.lng, radiusKm: radius, limit: 24 })
      .then((res) => {
        if (!cancelled) setPlaces(res.data ?? [])
      })
      .catch(() => {
        if (!cancelled) setPlaces([])
      })
    return () => {
      cancelled = true
    }
  }, [radius, userLocation])

  const filtered = useMemo(() => {
    if (!places) return null
    const list =
      filter === "all"
        ? places
        : places.filter((p) => p.category.toUpperCase() === filter)
    return [...list].sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
  }, [places, filter])

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => {},
      { timeout: 8000 },
    )
  }

  return (
    <section className="bg-[#0b1528] text-white py-16 sm:py-20 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E7C868]">
            Map Discovery
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-1.5">
            Discover what&rsquo;s around you
          </h2>
          <p className="text-sm text-white/70 mt-2">
            Hotels, heritage, food and experiences — all within reach.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {}
          <div className="lg:col-span-3 rounded-3xl overflow-hidden border border-white/10 shadow-2xl min-h-[420px] bg-[#0B1528] relative">
            {filtered && (
              <HeritageMap
                places={filtered.slice(0, 30)}
                searchCenter={userLocation ?? ADDIS_CENTER}
                radiusKm={radius}
                userLocation={userLocation}
              />
            )}
          </div>

          {}
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex flex-wrap gap-1.5 mb-4">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                    filter === f.id
                      ? "bg-[#E7C868] text-[#0B1528]"
                      : "bg-white/8 text-white/80 border border-white/15 hover:bg-white/15"
                  }`}
                >
                  <f.icon className="w-3 h-3" />
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 mb-4">
              <button
                onClick={useMyLocation}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E7C868] hover:text-white transition-colors"
              >
                <Crosshair className="w-3.5 h-3.5" />
                Use my location
              </button>
              <div className="flex rounded-full bg-white/8 border border-white/15 p-0.5">
                {RADII.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      radius === r
                        ? "bg-white text-[#0b1528]"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
              {!filtered &&
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-24 w-full rounded-2xl bg-white/10"
                  />
                ))}
              {filtered?.length === 0 && (
                <p className="text-sm text-white/50 py-8 text-center">
                  No places found within {radius} km. Try a wider radius.
                </p>
              )}
              {filtered?.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl bg-white/6 border border-white/10 p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold truncate">{p.name}</h3>
                      <p className="text-[11px] text-white/55 mt-0.5">
                        {p.category.charAt(0) +
                          p.category.slice(1).toLowerCase()}{" "}
                        ·{" "}
                        {p.distanceKm != null
                          ? `${p.distanceKm.toFixed(1)} km`
                          : p.address}
                        {p.rating != null && ` · ★ ${p.rating.toFixed(1)}`}
                        {p.openingHours ? ` · ${p.openingHours}` : ""}
                      </p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#E7C868] text-[#0B1528] text-[11px] font-bold px-2.5 py-1.5 hover:bg-white transition-colors"
                    >
                      <Navigation className="w-3 h-3" />
                      Navigate
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/discover"
              className="mt-4 text-center text-xs font-semibold text-[#E7C868] hover:text-white transition-colors"
            >
              Open full discovery map →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
