"use client"

// Category to Icon mapping in SVG format for Leaflet DivIcon

// Create custom leaflet marker icons
// Cancel any in-flight zoom/pan animation before starting another one.
// Without this, rapid radius/location updates can leave Leaflet's
// animation callback holding a removed pane and throw `_leaflet_pos`.
// Addis Ababa default center
/* Dynamic Radius Circle Overlay */ /* Proximity Vectors / Route Lines from Hotel/Center to Places */ /* User Location Marker */ /* Hotel Anchor Marker */ /* Place Markers */

import { useEffect, useMemo, useState } from "react"
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import Link from "next/link"
import type { LatLngBoundsExpression } from "leaflet"
import type { PlaceItem } from "@/lib/services"

export interface HeritageMapProps {
  places: PlaceItem[]
  selectedPlaceId?: string | null
  onSelect?: (id: string | null) => void
  searchCenter?: { lat: number ;lng: number }
  hotel?: { name: string ;lat: number ;lng: number } | null
  userLocation?: { lat: number ;lng: number } | null
  radiusKm?: number | null
  showRoutes?: boolean
  onAddToTrip?: (place: PlaceItem) => void
  onAskAi?: (place: PlaceItem) => void
  detailUrlPrefix?: string
  className?: string
}
function getCategorySvg(category: string): string {
  const cat = (
    category ||
    ""
  ).toUpperCase()
  if (cat.includes("CASTLE") || cat.includes("GHEBBI")) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 20v-9H2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z"/><path d="M18 11V4H6v7"/><path d="M15 4v4"/><path d="M9 4v4"/><path d="M10 20v-4a2 2 0 0 1 4 0v4"/></svg>`
  }
  if (
    cat.includes("RELIGIOUS") ||
    cat.includes("CHURCH") ||
    cat.includes("MOSQUE")
  ) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M7 7h10"/><path d="m3 19 9-7 9 7v2H3z"/></svg>`
  }
  if (
    cat.includes("MUSEUM") ||
    cat.includes("HERITAGE") ||
    cat.includes("HISTORIC") ||
    cat.includes("MONUMENT")
  ) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`
  }
  if (
    cat.includes("DINING") ||
    cat.includes("COFFEE") ||
    cat.includes("RESTAURANT") ||
    cat.includes("CAFE")
  ) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" x2="6" y1="1" y2="4"/><line x1="10" x2="10" y1="1" y2="4"/><line x1="14" x2="14" y1="1" y2="4"/></svg>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`
}
function createPlaceIcon(place: PlaceItem, selected: boolean) {
  const svg = getCategorySvg(place.category)
  const size = selected ? 42 : 34
  const bgClass = selected
    ? "background: #0b1528; color: #e4bd55; border: 3px solid #e4bd55; box-shadow: 0 0 0 4px rgba(212,175,55,0.4), 0 8px 16px rgba(0,0,0,0.3);"
    : "background: #e4bd55; color: #0b1528; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.25);"

  return L.divIcon({
    className: "heritage-custom-pin",
    html: `
      <div style="width: ${size}px; height: ${size}px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; ${bgClass} transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer;">
        ${svg}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [
      size /
        2,
      size /
        2,
    ],
    popupAnchor: [0, -size / 2 - 4],
  })
}

function createHotelIcon(name: string) {
  return L.divIcon({
    className: "hotel-custom-pin",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 48px; height: 48px; border-radius: 9999px; background: rgba(15,41,66,0.2); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 40px; height: 40px; border-radius: 9999px; background: #0b1528; color: #ffffff; border: 3px solid #ffffff; box-shadow: 0 6px 18px rgba(15,41,66,0.4); display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e4bd55" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  })
}

function createUserIcon() {
  return L.divIcon({
    className: "user-custom-pin",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: rgba(59,130,246,0.3); animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;"></span>
        <div style="position: relative; width: 22px; height: 22px; border-radius: 9999px; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(37,99,235,0.4);"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  })
}

function FitMapBounds({
  places,
  hotel,
  userLocation,
  radiusKm,
}: {
  places: PlaceItem[]
  hotel?: { lat: number ;lng: number } | null
  userLocation?: { lat: number ;lng: number } | null
  radiusKm?: number | null
}) {
  const map = useMap()

  useEffect(() => {
    const coords: [number, number][] = []

    if (hotel && Number.isFinite(hotel.lat) && Number.isFinite(hotel.lng)) {
      coords.push([hotel.lat, hotel.lng])
    }
    if (
      userLocation &&
      Number.isFinite(userLocation.lat) &&
      Number.isFinite(userLocation.lng)
    ) {
      coords.push([userLocation.lat, userLocation.lng])
    }

    places.forEach((p) => {
      if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
        coords.push([p.lat, p.lng])
      }
    })

    if (
      coords.length >
      1
    ) {
      const bounds = coords as LatLngBoundsExpression
      map.stop?.()
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15, animate: true })
    } else if (
      coords.length ===
      1
    ) {
      map.stop?.()
      map.setView(coords[0], 14, { animate: true })
    }
  }, [places, hotel, userLocation, radiusKm, map])

  return null
}

export default function HeritageMap({
  places,
  selectedPlaceId,
  onSelect,
  searchCenter,
  hotel,
  userLocation,
  radiusKm,
  showRoutes = true,
  onAddToTrip,
  onAskAi,
  detailUrlPrefix = "/discover",
  className = "h-full w-full",
}: HeritageMapProps) {
  const validPlaces = useMemo(() => {
    const seen = new Set<string>()
    return places.filter((place) => {
      if (
        !Number.isFinite(place.lat) ||
        !Number.isFinite(place.lng) ||
        seen.has(place.id)
      ) {
        return false
      }
      seen.add(place.id)
      return true
    })
  }, [places])

  const userIcon = useMemo(() => createUserIcon(), [])
  const hotelIcon = useMemo(
    () => (hotel ? createHotelIcon(hotel.name) : null),
    [hotel?.name],
  )
  const placeIcons = useMemo(() => {
    const icons = new Map<string, L.DivIcon>()
    validPlaces.forEach((place) =>
      icons.set(
        place.id,
        createPlaceIcon(
          place,
          selectedPlaceId ===
            place.id,
        ),
      ),
    )
    return icons
  }, [validPlaces, selectedPlaceId])

  const anchorPoint = useMemo(() => {
    if (hotel && Number.isFinite(hotel.lat) && Number.isFinite(hotel.lng)) {
      return { lat: hotel.lat, lng: hotel.lng }
    }
    if (
      userLocation &&
      Number.isFinite(userLocation.lat) &&
      Number.isFinite(userLocation.lng)
    ) {
      return { lat: userLocation.lat, lng: userLocation.lng }
    }
    if (
      searchCenter &&
      Number.isFinite(searchCenter.lat) &&
      Number.isFinite(searchCenter.lng)
    ) {
      return { lat: searchCenter.lat, lng: searchCenter.lng }
    }
    if (
      validPlaces.length >
      0
    ) {
      return { lat: validPlaces[0].lat, lng: validPlaces[0].lng }
    }
    return { lat: 9.0105, lng: 38.7612 }
  }, [hotel, userLocation, searchCenter, validPlaces])

  const center: [number, number] = [anchorPoint.lat, anchorPoint.lng]

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full rounded-2xl z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <FitMapBounds
          places={validPlaces}
          hotel={hotel}
          userLocation={userLocation}
          radiusKm={radiusKm}
        />

        {}
        {radiusKm && radiusKm > 0 && (
          <Circle
            center={[anchorPoint.lat, anchorPoint.lng]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: "#e4bd55",
              weight: 2,
              dashArray: "6, 6",
              fillColor: "#e4bd55",
              fillOpacity: 0.08,
            }}
          />
        )}

        {}
        {showRoutes &&
          validPlaces.map((place) => (
            <Polyline
              key={`route-${place.id}`}
              positions={[
                [anchorPoint.lat, anchorPoint.lng],
                [place.lat, place.lng],
              ]}
              pathOptions={{
                color: selectedPlaceId === place.id ? "#0b1528" : "#e4bd55",
                weight: selectedPlaceId === place.id ? 3 : 1.5,
                dashArray: selectedPlaceId === place.id ? undefined : "4, 6",
                opacity: selectedPlaceId === place.id ? 0.9 : 0.45,
              }}
            />
          ))}

        {}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          >
            <Popup>
              <div className="p-1 text-xs">
                <strong className="text-blue-600">Your Current Location</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {}
        {hotel && Number.isFinite(hotel.lat) && Number.isFinite(hotel.lng) && (
          <Marker
            position={[hotel.lat, hotel.lng]}
            icon={hotelIcon ?? createHotelIcon(hotel.name)}
          >
            <Popup>
              <div className="p-2 space-y-1 text-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#e4bd55]">
                  Your Hotel Anchor
                </span>
                <h4 className="font-serif font-bold text-sm text-[#0b1528]">
                  {hotel.name}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Starting point for all heritage routes & distance
                  calculations.
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {}
        {validPlaces.map((place) => {
          const selected = selectedPlaceId === place.id
          const distKm =
            place.distanceKm ??
            distanceKm(anchorPoint.lat, anchorPoint.lng, place.lat, place.lng)

          return (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={
                placeIcons.get(place.id) ?? createPlaceIcon(place, selected)
              }
              eventHandlers={{
                click: () => onSelect?.(selected ? null : place.id),
              }}
            >
              <Popup>
                <div className="min-w-[200px] max-w-[260px] p-2 text-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                    <span className="inline-block rounded-md bg-[#FFF9E8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#e4bd55]">
                      {place.category}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      📍 {distKm.toFixed(1)} km away
                    </span>
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#0b1528] leading-snug">
                      {place.name}
                    </h4>
                    {place.amharicName && (
                      <p className="text-[11px] font-medium text-slate-500">
                        {place.amharicName}
                      </p>
                    )}
                    {place.address && (
                      <p className="mt-0.5 text-[10px] text-slate-400 line-clamp-1">
                        {place.address}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    {onAddToTrip && (
                      <button
                        type="button"
                        onClick={() => onAddToTrip(place)}
                        className="flex-1 rounded-lg bg-[#0b1528] px-2.5 py-1.5 text-center text-[11px] font-bold text-white hover:bg-[#1E3A5F] transition"
                      >
                        + Add to Trip
                      </button>
                    )}
                    {onAskAi && (
                      <button
                        type="button"
                        onClick={() => onAskAi(place)}
                        className="rounded-lg border border-[#e4bd55] bg-[#FFF9E8] px-2 py-1.5 text-[11px] font-bold text-[#0b1528] hover:bg-[#e4bd55]/20 transition"
                        title="Ask AI Historian"
                      >
                        ✨ Ask AI
                      </button>
                    )}
                    <Link
                      href={`${detailUrlPrefix}/${place.id}`}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 hover:border-[#e4bd55] transition"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadius = 6371
  const toRadians = (value: number) => (value * Math.PI) / 180
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
